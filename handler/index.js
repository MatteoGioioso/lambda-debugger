const {multiply,add, myObject,buildObject} = require("../lib/myFunctions");

function handler() {
    const firstNumber = 3
    const secondNumber = 6
    const addition = add(firstNumber, secondNumber);
    buildObject(myObject)
    console.log(addition)
    const multiplication = multiply(addition, 5)
    console.log(multiplication)
}

module.exports = {
    handler
}
