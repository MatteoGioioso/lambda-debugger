class DebuggerAPI {
    messagesCode = {
        CONTINUE: 0,
        ENABLE: 1,
        SET_BREAK_POINT: 2,
        GET_SCRIPT_CODE: 3
    }

    constructor({url}) {
        this._url = url
    }

    initClient(){
        const WebSocket = require('ws');
        this._ws = new WebSocket(this._url, {
            perMessageDeflate: false
        })

      return new Promise(resolve => {
          this._ws.once('open', () => {
              resolve()
          })
      })
    }

    _attachTemporaryResponseEvent(conditionCallback){
        return new Promise((resolve, reject) => {
            const eventListener = (buffer) => {
                const data = JSON.parse(buffer)
                if (conditionCallback(data)){
                    this._ws.removeEventListener('message', eventListener)
                    resolve(data)
                }

                if (data.error){
                    this._ws.removeEventListener('message', eventListener)
                    reject(data.error)
                }
            }

            this._ws.on('message', eventListener)
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
        return this._attachTemporaryResponseEvent((data) => {
            return data.method === 'Debugger.paused'
        })
    }

    enable(){
        this._ws.send(JSON.stringify({method: 'Debugger.enable', id: this.messagesCode.ENABLE}))
    }

    async setBreakpoint(lineNumber){
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
        return this._attachTemporaryResponseEvent((data) => {
            return data.id === this.messagesCode.SET_BREAK_POINT
        })
    }

    getScriptCode(scriptId){
        this._ws.send(JSON.stringify({
            method: 'Debugger.getScriptSource',
            params: {scriptId},
            id: this.messagesCode.GET_SCRIPT_CODE
        }))

        return this._attachTemporaryResponseEvent((data) => {
            return data.id === this.messagesCode.GET_SCRIPT_CODE
        })
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

    getSourceCodeId(data){
        if (data.method === 'Debugger.scriptParsed' && data.params.url.includes('test.js')){
            return data.params.scriptId
        }
    }
}

module.exports = {
    DebuggerAPI
}
