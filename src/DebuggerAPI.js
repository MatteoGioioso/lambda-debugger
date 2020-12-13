class DebuggerAPI {
    messagesCode = {
        CONTINUE: 0,
        ENABLE: 1,
        SET_BREAK_POINT: 2,
        GET_SCRIPT_CODE: 3
    }

    constructor({processId}) {
        this._processId = processId
    }

    initClient(){
        const WebSocket = require('ws');
        this._ws = new WebSocket(`ws://localhost:9229/${this._processId}`, {
            perMessageDeflate: false
        })
    }

    get client() {
        return this._ws
    }

    continue(){
        this._ws.send(JSON.stringify({
            method: 'Runtime.runIfWaitingForDebugger',
            id: this.messagesCode.CONTINUE
        }))
    }

    enable(){
        this._ws.send(JSON.stringify({method: 'Debugger.enable', id: this.messagesCode.ENABLE}))
    }

    setBreakpoint(lineNumber){
        this._ws.send(JSON.stringify({
            method: 'Debugger.setBreakpoint',
            id: this.messagesCode.SET_BREAK_POINT,
            params: {
                location: {
                    scriptId: '69',
                    lineNumber
                }
            }
        }))
    }

    getScriptCode(){
        this._ws.send(JSON.stringify({
            method: 'Debugger.getScriptSource',
            params: {scriptId: '69'},
            id: this.messagesCode.GET_SCRIPT_CODE
        }))
    }

    getObject(id){
        this._ws.send(JSON.stringify({
            method: 'Runtime.getProperties',
            params: {
                objectId: id
            },
            id: 48
        }))
    }
}

module.exports = {
    DebuggerAPI
}
