const {DebuggerAPI} = require("./src/DebuggerAPI");
const api = new DebuggerAPI({processId: '8b4f3a19-948b-4b6b-ac8b-366e7067e77'})
api.initClient()

const currentStack = {}

api.client.on('open', function open() {
    api.enable()
    api.setBreakpoint(11)
    api.continue()
});

api.client.on('message', function incoming(data) {
    console.log(data)

    const parsedData = JSON.parse(data)
    if(parsedData.method === 'Debugger.scriptParsed' && parsedData.params.url.includes('test.js')){
        console.log("scriptId: ", parsedData.params.scriptId)
        currentStack[parsedData.params.hash] = {
            ...parsedData.params
        }
    }

    if (parsedData.result){
        // console.log(parsedData.result)
    }


    if (parsedData.error) {
        console.log(JSON.stringify(parsedData.error, null, 2))
    }

    if (parsedData.method === 'Debugger.paused'){
        console.log(JSON.stringify(parsedData, null, 2))
        api.getObject("{\"injectedScriptId\":1,\"id\":1}")
    }
});


