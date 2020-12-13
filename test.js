const inspector = require('inspector')
inspector.open(9229, 'localhost', true)
console.log("Url: ", inspector.url())

const session = new inspector.Session()
session.on('inspectorNotification', (message) => console.log(message.method));

function add(a, b) {
    return a + b
}
const firstNumber = 3
const secondNumber = 6
const res = add(firstNumber, secondNumber);
const addResult = res
console.log(addResult)
inspector.close()
