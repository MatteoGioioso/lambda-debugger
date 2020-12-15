class DebuggerAPI {
    messagesCode = {
        CONTINUE: 0,
        ENABLE: 1,
        SET_BREAK_POINT: 2,
        GET_SCRIPT_CODE: 3,
        GET_OBJECT: 4,
        STEP_OVER: 5,
        STEP_INTO: 6,
        RESUME: 7
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

    stepOver(){
        this._ws.send(this._createPayload({
            id: this.messagesCode.STEP_OVER,
            method: 'Debugger.stepOver'
        }))

        return this._attachTemporaryResponseEvent(data => {
            return data.method === 'Debugger.paused'
        })
    }

    stepInto(){
        this._ws.send(this._createPayload({
            id: this.messagesCode.STEP_INTO,
            method: 'Debugger.stepInto'
        }))

        return this._attachTemporaryResponseEvent(data => {
            return data.method === 'Debugger.paused'
        })
    }


    _getLineId(callFrame){
        return callFrame.location.lineNumber
    }

    async _getLineScript(callFrame){
        const script = await this.getScriptCode(callFrame.location.scriptId)
        const lineNumber = callFrame.location.lineNumber
        const columnNumber = callFrame.location.columnNumber
        const scriptSource = script.result.scriptSource
        const sourceLine = scriptSource.split('\n')[lineNumber];
        return sourceLine.slice(0, columnNumber)
    }

    _filterLocalObjectIds(callFrame) {
        return callFrame
            .scopeChain
            .filter(sc => sc.type === 'local')
            .map(sc => sc.object.objectId)
    }

    async getMetaFromStep(continueForDebugger){
        let meta = {};
        let pausedExecutionMeta;
        if (continueForDebugger){
            pausedExecutionMeta = await this.waitForDebugger();
        } else {
            pausedExecutionMeta = await this.stepInto()
        }

        meta['__main'] = {
            // file: process.env.MAIN_FILE
        }

        for await (const callFrame of pausedExecutionMeta.params.callFrames) {
            if (
                callFrame.url &&
                callFrame.url.includes(process.env.PROJECT_ROOT)
            ) {
                if (callFrame.scopeChain){

                    meta[`Local (${callFrame.url})`] = {
                        line: {
                            number: this._getLineId(callFrame),
                        },
                        file: callFrame.url,
                        functions: {}
                    }
                    const objectIds = this._filterLocalObjectIds(callFrame)

                    for await (const objectId of objectIds) {
                        const object = await this.getObject(objectId)
                        for await (const obj of object.result.result) {
                            if (obj.value.type === 'function'){
                                meta[`Local (${callFrame.url})`].functions[obj.name] = {}
                            } else {
                                meta[`Local (${callFrame.url})`][obj.name] = obj.value.value
                            }
                        }
                    }
                }
            }
        }
        return meta
    }

    resume(){
        this._ws.send(this._createPayload({
            id: this.messagesCode.RESUME,
            method: 'Debugger.resume'
        }))
    }
}

module.exports = {
    DebuggerAPI
}
