const fork = require('child_process').fork
const path = require('path')
const inspector = require('inspector')
const {add, multiply} = require("./lib/myFunctions");
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
const addition = add(firstNumber, secondNumber);
console.log(addition)
const multiplication = multiply(addition, 5)
console.log(multiplication)
inspector.close()
