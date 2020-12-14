class DebuggerAPI {
    messagesCode = {
        CONTINUE: 0,
        ENABLE: 1,
        SET_BREAK_POINT: 2,
        GET_SCRIPT_CODE: 3,
        GET_OBJECT: 4,
        STEP_OVER: 5
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

    _createPayload({method, id, params}){
        return JSON.stringify({
            method, id, params
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

    waitForDebugger(){
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
            id: this.messagesCode.GET_OBJECT
        }))
        return this._attachTemporaryResponseEvent((data) => {
            return data.id === this.messagesCode.GET_OBJECT
        })
    }

    getSourceCodeId(data){
        if (data.method === 'Debugger.scriptParsed' && data.params.url.includes('test.js')){
            return data.params.scriptId
        }
    }

    stepOver(){
        this._ws.send(this._createPayload({
            id: this.messagesCode.STEP_OVER,
            method: 'Debugger.stepOver'
        }))

        return this._attachTemporaryResponseEvent(data => {
            return data.method === 'Debugger.paused'
        })
    }

    _getLineId(callFrame){
        return callFrame.location.lineNumber
    }

    async getMetaFromStep(continueForDebugger){
        let meta = {};
        let pausedExecutionMeta;
        if (continueForDebugger){
            pausedExecutionMeta = await this.waitForDebugger();
        } else {
            pausedExecutionMeta = await this.stepOver()
        }

        for await (const callFrame of pausedExecutionMeta.params.callFrames) {
            if (callFrame.url && callFrame.url.includes('test.js')) {
                // console.log(JSON.stringify(callFrame, null, 2))
                if (callFrame.scopeChain){
                    meta[this._getLineId(callFrame)] = {
                        variables: []
                    }
                    const objectIds = callFrame.scopeChain.map(sc => sc.object.objectId)
                    for await (const objectId of objectIds) {
                        const object = await this.getObject(objectId)
                        for await (const obj of object.result.result) {
                            if (obj && obj.value){
                                if (['firstNumber', 'secondNumber', 'addResult', 'add', 'anotherVariable'].includes(obj.name)){
                                    meta[this._getLineId(callFrame)].variables.push({
                                        type: obj.value.type,
                                        value: obj.value.value || obj.value,
                                        name: obj.name
                                    })
                                }
                            }
                        }
                    }
                }
            }
        }
        return meta
    }
}

module.exports = {
    DebuggerAPI
}
