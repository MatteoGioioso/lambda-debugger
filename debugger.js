const {DebuggerAPI} = require("./src/DebuggerAPI");
const api = new DebuggerAPI({url: process.env.DEBUGGER_FULL_URL});

(async function () {
    await api.initClient()
    api.enable()
    // await api.setBreakpoint(11)
    // await api.continue()
    // const sourceCode = await api.getScriptCode()
    // console.log(sourceCode)
    // const result = await api.getObject("{\"injectedScriptId\":1,\"id\":1}");
    // console.log(result)
})();

api.client.on('message', async (buffer) => {
    const data = JSON.parse(buffer)

    const sourceCodeId = api.getSourceCodeId(data);

    if (sourceCodeId) {
        const res = await api.getScriptCode(sourceCodeId)
        const lineIndex = res.result.scriptSource
            .split('\n')
            .findIndex(line => line.includes('// -- START DEBUGGER -- //'));
         await api.setBreakpoint(lineIndex+1)

        const codePaused = await api.continue();
        console.log(codePaused)
    }
})
