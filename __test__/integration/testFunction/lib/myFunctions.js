const myObject = {
    name: 'matteo',
    age: 36,
}

function internal() {
    let int = 3
    return 3 * int
}

function buildObject(obj) {
    obj.anotherProperty = 3
}

function add(subFirstNumber, subSecondNumber) {
    const {age} = myObject;
    internal()
    return subFirstNumber + subSecondNumber + age
}

function multiply(total, multiplier) {
    const result = total * multiplier
    return result
}

module.exports = {
    add,
    multiply,
    myObject,
    buildObject
}
