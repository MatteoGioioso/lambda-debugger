const { DebuggerAPI } = require("./src/DebuggerAPI");
const api = new DebuggerAPI({url: process.env.DEBUGGER_FULL_URL});
const fs = require('fs')
const file = [];

const recordExecution = async () => {
    while (true) {
        const stack = await api.getMetaFromStep(false)
        file.push(stack)
    }
}

process.on('beforeExit', () => {
    fs.writeFileSync(
        'debugger.json',
        JSON.stringify(file, null, 2),
        'utf-8'
    )
});

(async function () {
    await api.initClient()
    const scriptInfo = await api.enable();
    await api.setBreakpoint(
        32,
        scriptInfo.params.scriptId
    )
    process.send('brokerConnect');
    await recordExecution()
})();
