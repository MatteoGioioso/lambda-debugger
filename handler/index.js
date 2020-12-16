const {multiply,add} = require("../lib/myFunctions");

function handler() {
    const firstNumber = 3
    const secondNumber = 6
    const addition = add(firstNumber, secondNumber);
    console.log(addition)
    const multiplication = multiply(addition, 5)
    console.log(multiplication)
}

module.exports = {
    handler
}
