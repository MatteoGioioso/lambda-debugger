const fork = require('child_process').fork
const path = require('path')
const inspector = require('inspector')

inspector.open(9229, 'localhost', false)
// Fork the process to start the debugger
const debuggerProxy = fork(
    path.join(__dirname, 'src/nodejs/debugger.js'),
    [],
    {
        detached: true,
        env: {
            DEBUGGER_FULL_URL: inspector.url(),
            PROJECT_ROOT: 'lambda-debugger',
            LAMBDA_DEBUGGER_OUTPUT: path.join(__dirname, '/tmp'),
            LAMBDA_DEBUGGER_DEST_BUCKET: '/',
            START_LINE: 33
        },
    },
)

function waitForDebuggerConnection(){
    return new Promise((resolve, reject) => {
        debuggerProxy.once('message', (mes) => {
            if (mes === 'brokerConnect') {
                return resolve('connected');
            }

            return reject('failed to connect');
        });
    })
}

waitForDebuggerConnection().then(async (res) => {
    const {handler} = require('./handler')
    await handler()
    inspector.close()
})
