const {DebuggerAPI} = require("./src/DebuggerAPI");
const api = new DebuggerAPI({url: process.env.DEBUGGER_FULL_URL});

(async function () {
    await api.initClient()
    api.enable()
    await api.setBreakpoint(20)

    console.log(JSON.stringify((await api.getMetaFromStep(true)), null, 2))
    console.log(JSON.stringify((await api.getMetaFromStep()), null, 2))
    console.log(JSON.stringify((await api.getMetaFromStep()), null, 2))
    console.log(JSON.stringify((await api.getMetaFromStep()), null, 2))
    console.log(JSON.stringify((await api.getMetaFromStep()), null, 2))
    console.log(JSON.stringify((await api.getMetaFromStep()), null, 2))
    console.log(JSON.stringify((await api.getMetaFromStep()), null, 2))
    console.log(JSON.stringify((await api.getMetaFromStep()), null, 2))
    console.log(JSON.stringify((await api.getMetaFromStep()), null, 2))
    console.log(JSON.stringify((await api.getMetaFromStep()), null, 2))
    console.log(JSON.stringify((await api.getMetaFromStep()), null, 2))
    console.log(JSON.stringify((await api.getMetaFromStep()), null, 2))
    console.log(JSON.stringify((await api.getMetaFromStep()), null, 2))
    console.log(JSON.stringify((await api.getMetaFromStep()), null, 2))
    console.log(JSON.stringify((await api.getMetaFromStep()), null, 2))
    console.log(JSON.stringify((await api.getMetaFromStep()), null, 2))
    console.log(JSON.stringify((await api.getMetaFromStep()), null, 2))
})();
