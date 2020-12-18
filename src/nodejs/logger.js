function logger(message) {
    if (process.env.LAMBDA_debugger_DEBUG === "ALL") {
        console.log("[LAMBDA debugger]: ", JSON.stringify(message))
    }
}

function loggerTimeSTART(message) {
    if (process.env.LAMBDA_debugger_DEBUG === "ALL") {
        console.log("[LAMBDA debugger] ", message)
    }
}

function loggerTimeSTOP(message) {
    if (process.env.LAMBDA_debugger_DEBUG === "ALL") {
        console.log("[LAMBDA debugger] ", message)
    }
}


module.exports = {
    logger,
    loggerTimeSTART,
    loggerTimeSTOP
}
