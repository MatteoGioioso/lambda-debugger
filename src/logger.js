function logger(message, stack) {
    if (process.env.LAMBDA_DEBUGGER_DEBUG === "ALL") {
        console.log("[LAMBDA DEBUGGER]: ", JSON.stringify(message))
        if (stack){
            console.log("[LAMBDA DEBUGGER]: ", stack)
        }
    }
}

function loggerTimeSTART(message) {
    if (process.env.LAMBDA_DEBUGGER_DEBUG === "ALL") {
        console.log("[LAMBDA DEBUGGER] ", message)
    }
}

function loggerTimeSTOP(message) {
    if (process.env.LAMBDA_DEBUGGER_DEBUG === "ALL") {
        console.log("[LAMBDA DEBUGGER] ", message)
    }
}


module.exports = {
    logger,
    loggerTimeSTART,
    loggerTimeSTOP
}
