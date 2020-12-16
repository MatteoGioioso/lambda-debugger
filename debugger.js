const { DebuggerAPI } = require("./src/DebuggerAPI");
const api = new DebuggerAPI({url: process.env.DEBUGGER_FULL_URL});
const file = [];

const recordExecution = async () => {
    while (true) {
        const stack = await api.getMetaFromStep(false)
        await require('util').promisify(setTimeout)(500)
        console.log('=============================\n\n')
        file.push(stack)
    }
}

(async function () {
    await api.initClient()
    const scriptInfo = await api.enable();
    // const breakpoints = await api.getPossibleBreakpoints(
    //     scriptInfo.params.scriptId,
    //     scriptInfo.params.startLine,
    //     scriptInfo.params.endLine
    // );
    // console.log(breakpoints.result.locations)
    await api.setBreakpoint(34, scriptInfo.params.scriptId)
    process.send('brokerConnect');
    await recordExecution()
    console.log(file)
})();
