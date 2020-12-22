const {logger} = require("./logger");
const { DebuggerAPI } = require("./DebuggerAPI");

const {
    DEBUGGER_FULL_URL,
    START_LINE
} = process.env
const api = new DebuggerAPI({url: DEBUGGER_FULL_URL});
const executions = [];

const recordExecution = async () => {
    while (true) {
        const stack = await api.getStackForCurrentStep(false)
        executions.push(stack)
    }
}

process.on('beforeExit', async () => {
    try {
        logger('Start post processing')
        process.send({executions, files: api.files}, () => {
            // Send process is asynchronous therefore the child process must
            // be closed after the full message has being sent
            logger('Done sending')
            api.terminateClient()
            process.exit(0)
        })
    } catch (e) {
        logger(e.message, e.stack)
        process.exit(1)
    }
});

(async function () {
    logger('Starting debugger')
    await api.initClient()
    api.collectSourceCode()
    const scriptInfo = await api.enable();
    await api.setBreakpoint(
        Number(START_LINE) - 1, // this could be arbitrarily set depending on the final code
        scriptInfo.params.scriptId
    )
    process.send('brokerConnect');
    await recordExecution()
})();

process.on('error', e => {
    console.log("ERROR !!!!!")
    console.log(e.message)
})
