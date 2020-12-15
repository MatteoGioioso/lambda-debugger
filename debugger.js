const {DebuggerAPI} = require("./src/DebuggerAPI");
const api = new DebuggerAPI({url: process.env.DEBUGGER_FULL_URL});

const file = [];

const recordExecution = async () => {
    while (true) {
        const stack = await api.getMetaFromStep()
        file.push(stack)

        const keys = Object.keys(stack)

        if (stack[keys[keys.length-1]].line.number === 25){
            break
        }
    }
}

(async function () {
    await api.initClient()
    api.enable()
    await api.setBreakpoint(20)
    const stack = await api.getMetaFromStep(true)
    file.push(stack)
    await recordExecution()
    api.resume()
    console.log(JSON.stringify(file, null, 2))
})();
