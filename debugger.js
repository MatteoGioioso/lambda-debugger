const {DebuggerAPI} = require("./src/DebuggerAPI");
const api = new DebuggerAPI({url: process.env.DEBUGGER_FULL_URL});

const file = [];

const recordExecution = async () => {
    while (true) {
        const stack = await api.getMetaFromStep()
        file.push(stack)

        const keys = Object.keys(stack)
        const currentLineNumber = stack[keys[1]].line.number
        console.log(currentLineNumber)
        if (currentLineNumber === 25){
            break
        }
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

    await api.setBreakpoint(20)
    console.log((await api.getMetaFromStep(true)))
    console.log((await api.getMetaFromStep()))
    console.log((await api.getMetaFromStep()))
    console.log((await api.getMetaFromStep()))
})();
