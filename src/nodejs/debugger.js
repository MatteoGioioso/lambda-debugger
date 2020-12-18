const { DebuggerAPI } = require("./DebuggerAPI");
const {
    DEBUGGER_FULL_URL,
    ARTIFACT_FOLDER,
    START_LINE
} = process.env
const api = new DebuggerAPI({url: DEBUGGER_FULL_URL});
const path = require('path')
const fs = require('fs')
const executions = [];

const recordExecution = async () => {
    while (true) {
        const stack = await api.getStackForCurrentStep(false)
        executions.push(stack)
    }
}

process.on('beforeExit', async () => {
    try {
        const html = await fs.promises.readFile(path.join(__dirname, 'index.html'), 'utf8');
        const debugData = JSON.stringify(executions, null, 2)
        const filesData = JSON.stringify(api.files, null, 2)
        const newHtml = html
            .replace('//---DEBUG.JSON---//', debugData)
            .replace('//---FILES.JSON---//', filesData)

        await fs.promises.writeFile(path.join(__dirname, '../../tmp/index.html'), newHtml)

        api.terminateClient()

        process.exit(0)
    } catch (e) {
        console.log(e.message, e.stack)
        process.exit(1)
    }
});

(async function () {
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
