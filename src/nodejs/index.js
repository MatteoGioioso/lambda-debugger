const {RuntimeAPI} = require("./RuntimeAPI");
const CALLBACK_USED = Symbol('CALLBACK_USED')
const inspector = require('inspector')
const path = require('path')
const fork = require('child_process').fork
const {logger} = require('./logger')

const {
    LAMBDA_TASK_ROOT,
    _HANDLER,
} = process.env
const runtimeAPI = new RuntimeAPI()

start()

function waitForDebuggerConnection(debuggerProcess){
    return new Promise((resolve, reject) => {
        debuggerProcess.once('message', (mes) => {
            if (mes === 'brokerConnect') {
                return resolve('connected');
            }

            return reject('failed to connect');
        });
    })
}

function forkDebuggerProcess(){
    return fork(
        path.join(__dirname, 'debugger.js'),
        [],
        {
            detached: true,
            env: {
                DEBUGGER_FULL_URL: inspector.url(),
                PROJECT_ROOT: LAMBDA_TASK_ROOT,
                ARTIFACT_FOLDER: '/tmp',
                START_LINE: 72
            },
        },
    )
}

async function start() {
    let handler
    try {
        handler = getHandler()
    } catch (e) {
        await runtimeAPI.initError(e)
        return process.exit(1)
    }
    tryProcessEvents(handler)
}

async function tryProcessEvents(handler) {
    try {
        await processEvents(handler)
        process.exit(0)
    } catch (e) {
        logger(e.message, e.stack)
        return process.exit(1)
    }
}

async function processEvents(handler) {
    while (true) {
        const { event, context } = await runtimeAPI.nextInvocation()
        let result
        try {
            inspector.open(9229, 'localhost', false)
            const debuggerProcess = forkDebuggerProcess();
            await waitForDebuggerConnection(debuggerProcess)
            result = await handler(event, context)
            inspector.close()
        } catch (e) {
            logger(e.message)
            await runtimeAPI.invokeError(e, context)
            // TODO: maybe is not needed
            // test for error
            continue
        }

        await runtimeAPI.invokeResponse(result, context)
        logger("exiting...")
        return
    }
}

function getHandler() {
    const appParts = _HANDLER.split('.')

    if (appParts.length !== 2) {
        throw new Error(`Bad handler ${_HANDLER}`)
    }

    const [modulePath, handlerName] = appParts

    // Let any errors here be thrown as-is to aid debugging
    const app = require(LAMBDA_TASK_ROOT + '/' + modulePath)

    const userHandler = app[handlerName]

    if (userHandler == null) {
        throw new Error(`Handler '${handlerName}' missing on module '${modulePath}'`)
    } else if (typeof userHandler !== 'function') {
        throw new Error(`Handler '${handlerName}' from '${modulePath}' is not a function`)
    }

    return (event, context) => new Promise((resolve, reject) => {
        context.succeed = resolve
        context.fail = reject
        context.done = (err, data) => err ? reject(err) : resolve(data)

        const callback = (err, data) => {
            context[CALLBACK_USED] = true
            context.done(err, data)
        }

        let result
        try {
            result = userHandler(event, context, callback)
        } catch (e) {
            return reject(e)
        }
        if (result != null && typeof result.then === 'function') {
            result.then(resolve, reject)
        }
    })
}
