export const myObject = {
    name: 'matteo',
    age: 36,
}

export function internal() {
    let int = 3
    return 3 * int
}

export function buildObject(obj) {
    obj.anotherProperty = 3
}

export function add(subFirstNumber, subSecondNumber) {
    const {age} = myObject;
    internal()
    return subFirstNumber + subSecondNumber + age
}

export function multiply(total, multiplier) {
    const result = total * multiplier
    return result
}
