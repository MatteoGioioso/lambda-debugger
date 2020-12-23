import {add, buildObject, multiply, myObject} from "./lib/myFunctions"
import lambdaDebugger from 'lambda-debugger'

function myPromise() {
    return Promise.resolve(20)
}

async function handler(event, context) {
    try {
        const firstNumber = 3
        const secondNumber = 6
        const addition = add(firstNumber, secondNumber);
        buildObject(myObject)
        console.log(addition)
        const multiplier = await myPromise()
        const multiplication = multiply(addition, multiplier)
        console.log(multiplication)
        return {
            body: 'done',
            statusCode: 200
        }

    } catch (e) {
        console.log(e.message, e.stack)
        return {
            body: 'oops',
            statusCode: 500
        }
    }
}

exports.handler = lambdaDebugger(handler)

