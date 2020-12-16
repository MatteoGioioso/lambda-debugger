function internal() {
    let int = 3
    return 3 * int
}

function add(subFirstNumber, subSecondNumber) {
    const anotherVariable = 4
    internal()
    return subFirstNumber + subSecondNumber + anotherVariable
}

function multiply(total, multiplier) {
    const result = total * multiplier
    return result
}

module.exports = {
    add,
    multiply
}
