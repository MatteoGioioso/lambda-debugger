const fork = require('child_process').fork
const path = require('path')
const inspector = require('inspector')
const {add} = require("./lib/myFunctions");
inspector.open(9229, 'localhost', false)
// Fork the process to start the debugger
fork(
    path.join(__dirname, 'debugger.js'),
    [],
    {
        detached: true,
        env: {
            DEBUGGER_FULL_URL: inspector.url(),
            PROJECT_ROOT: 'lambda-debugger',
        },
    },
)

inspector.waitForDebugger()
const firstNumber = 3
const secondNumber = 6
const res = add(firstNumber, secondNumber);
const addResult = res
console.log(addResult)
inspector.close()
