const inspector = require('inspector')
const path = require('path')
const fork = require('child_process').fork
const {logger} = require('./logger')

const CALLBACK_USED = Symbol('CALLBACK_USED')
const {
    LAMBDA_TASK_ROOT,
    LAMBDA_DEBUGGER_DEST_BUCKET,
    LAMBDA_DEBUGGER_OUTPUT,
    LAMBDA_DEBUGGER_DEBUG,
    AWS_LAMBDA_FUNCTION_NAME,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_SESSION_TOKEN,
} = process.env

function waitForDebuggerConnection(debuggerProcess) {
    return new Promise((resolve, reject) => {
        debuggerProcess.once('message', (mes) => {
            if (mes === 'brokerConnect') {
                logger('Debugger connected!')
                return resolve('connected');
            }

            return reject('failed to connect');
        });
    })
}

function forkDebuggerProcess() {
    return fork(
        path.join(__dirname, 'debugger.js'),
        [],
        {
            detached: true,
            env: {
                DEBUGGER_FULL_URL: inspector.url(),
                PROJECT_ROOT: LAMBDA_TASK_ROOT,
                START_LINE: 57,
                LAMBDA_DEBUGGER_OUTPUT,
                LAMBDA_DEBUGGER_DEST_BUCKET,
                LAMBDA_DEBUGGER_DEBUG,
                AWS_ACCESS_KEY_ID,
                AWS_SECRET_ACCESS_KEY,
                AWS_SESSION_TOKEN,
                AWS_LAMBDA_FUNCTION_NAME
            },
        },
    )
}

module.exports = function (handler) {
    return async (event, context) => {
        inspector.open(9229, 'localhost', false)
        const debuggerProcess = forkDebuggerProcess();
        await waitForDebuggerConnection(debuggerProcess)
        const result = await handler(event, context)
        inspector.close()
        return result
    }
}
