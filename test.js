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
            ARTIFACT_FOLDER: 'tmp/',
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
