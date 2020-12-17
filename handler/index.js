const {multiply,add, myObject,buildObject} = require("../lib/myFunctions");

function myPromise() {
    return Promise.resolve(20)
}

async function handler() {
    const firstNumber = 3
    const secondNumber = 6
    const addition = add(firstNumber, secondNumber);
    buildObject(myObject)
    console.log(addition)
    const multiplier = await myPromise()
    const multiplication = multiply(addition, multiplier)
    console.log(multiplication)
}

module.exports = {
    handler
}
