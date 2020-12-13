const fork = require('child_process').fork
const path = require('path')
const inspector = require('inspector')
inspector.open(9229, 'localhost', false)
// Fork the process to start the debugger
fork(
    path.join(__dirname, 'debugger.js'),
    [],
    {
        detached: true,
        env: {
            DEBUGGER_FULL_URL: inspector.url()
        },
    },
)

// stop the debugger
inspector.waitForDebugger()

function add(a, b) {
    return a + b
}
const firstNumber = 3
const secondNumber = 6

// -- START DEBUGGER -- //
const res = add(firstNumber, secondNumber);
const addResult = res
console.log(addResult)
inspector.close()
