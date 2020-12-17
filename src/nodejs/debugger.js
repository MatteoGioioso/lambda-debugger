const { DebuggerAPI } = require("./DebuggerAPI");
const {
    DEBUGGER_FULL_URL,
    ARTIFACT_FOLDER
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

process.on('beforeExit', () => {
    try {
        fs.writeFileSync(
            path.join(ARTIFACT_FOLDER, 'debug.json'),
            JSON.stringify(executions, null, 2),
            'utf-8'
        )

        const files = api.files

        fs.writeFileSync(
            path.join(ARTIFACT_FOLDER, 'files.json'),
            JSON.stringify(files, null, 2),
            'utf-8'
        )

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
        32, // this could be arbitrarily set depending on the final code
        scriptInfo.params.scriptId
    )
    process.send('brokerConnect');
    await recordExecution()
})();
