const {add,multiply} = require("./lib/myFunctions");
const firstNumber = 3
const secondNumber = 6
const addition = add(firstNumber, secondNumber);
console.log(addition)
const multiplication = multiply(addition, 5)
console.log(multiplication)
