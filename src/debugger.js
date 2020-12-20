const {logger} = require("./logger");
const { DebuggerAPI } = require("./DebuggerAPI");
const {Collector} = require("./Collector");

const {
    DEBUGGER_FULL_URL,
    START_LINE
} = process.env
const api = new DebuggerAPI({url: DEBUGGER_FULL_URL});
const collector = new Collector()
const executions = [];

const recordExecution = async () => {
    while (true) {
        const stack = await api.getStackForCurrentStep(false)
        executions.push(stack)
    }
}

process.on('beforeExit', async () => {
    try {
        await collector.injectDebuggerOutputIntoHtml(executions, api.files)
        await collector.sendToDest()
        await collector.cleanUpFiles()
        api.terminateClient()
        process.exit(0)
    } catch (e) {
        console.log(e.message, e.stack)
        process.exit(1)
    }
});

(async function () {
    logger('Starting debugger')
    await api.initClient()
    api.collectSourceCode()
    const scriptInfo = await api.enable();
    await api.setBreakpoint(
        Number(START_LINE), // this could be arbitrarily set depending on the final code
        scriptInfo.params.scriptId
    )
    process.send('brokerConnect');
    await recordExecution()
})();
