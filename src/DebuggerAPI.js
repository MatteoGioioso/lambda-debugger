class DebuggerAPI {
    messagesCode = {
        CONTINUE: 0,
        ENABLE: 1,
        SET_BREAK_POINT: 2,
        GET_SCRIPT_CODE: 3,
        GET_OBJECT: 4,
        STEP_OVER: 5,
        STEP_INTO: 6,
        RESUME: 7,
        GET_POSSIBLE_BREAKPOINTS: 8,
        STEP_OUT: 9
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
                    return resolve(data)
                }

                if (conditionCallback(data) && data.error){
                    this._ws.removeEventListener('message', eventListener)
                    console.error(data.error)
                    return reject(data.error)
                }
            }

            this._ws.on('message', eventListener)
        })
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

    async enable(){
        this._ws.send(JSON.stringify({method: 'Debugger.enable', id: this.messagesCode.ENABLE}))
        return this._attachTemporaryResponseEvent(data => {
            return data.method === 'Debugger.scriptParsed' && data.params.url.includes(process.env.PROJECT_ROOT)
        })
    }

    async setBreakpoint(lineNumber, scriptId){
        this._ws.send(JSON.stringify({
            method: 'Debugger.setBreakpoint',
            id: this.messagesCode.SET_BREAK_POINT,
            params: {
                location: {
                    scriptId,
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

    _getScopeChainObjects(id){
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

    stepOut(){
        this._ws.send(this._createPayload({
            id: this.messagesCode.STEP_OUT,
            method: 'Debugger.stepOut'
        }))
        return this._attachTemporaryResponseEvent(data => {
            return data.id === this.messagesCode.STEP_OUT
        })
    }

    getPossibleBreakpoints(scriptId, startLine, endLine){
        this._ws.send(this._createPayload({
            id: this.messagesCode.GET_POSSIBLE_BREAKPOINTS,
            method: 'Debugger.getPossibleBreakpoints',
            params: {
                start: {
                    scriptId, lineNumber: startLine
                },
                end: {
                    scriptId, lineNumber: endLine
                }
            }
        }))

        return this._attachTemporaryResponseEvent(data => {
            return data.id === this.messagesCode.GET_POSSIBLE_BREAKPOINTS
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

    _filterLocalScopeChain(callFrame) {
        return callFrame
            .scopeChain
            .filter(sc => sc.type === 'local')
    }

    _getFileNameFromPath(callFrame){
        const split = callFrame.url.split('/');
        return split.slice(-1)[0]
    }

    _getStackKey(callFrame){
        const currentLineNumber = this._getLineId(callFrame)
        const functionName = callFrame.functionName
        const fileName = this._getFileNameFromPath(callFrame)
        return `${functionName || 'anonymous'}(), ${fileName}:${currentLineNumber}`
    }

    async getMetaFromStep(){
        let stack = {};
        let pausedExecutionMeta = await this.stepInto()

        for await (const callFrame of pausedExecutionMeta.params.callFrames) {
            if (
                callFrame.url &&
                callFrame.url.includes(process.env.PROJECT_ROOT)
            ) {
                if (callFrame.scopeChain){
                    stack[this._getStackKey(callFrame)] = {
                        meta: {
                            current: this._getLineId(callFrame),
                        },
                        file: callFrame.url,
                        local: {
                            functions: {},
                        }
                    }
                    const localScopeChain = this._filterLocalScopeChain(callFrame)

                    for await (const scope of localScopeChain) {
                        stack[this._getStackKey(callFrame)].meta.start = scope.startLocation.lineNumber
                        stack[this._getStackKey(callFrame)].meta.end = scope.endLocation.lineNumber
                        stack[this._getStackKey(callFrame)].meta.scriptId = scope.startLocation.scriptId
                        const objectId = scope.object.objectId
                        const object = await this._getScopeChainObjects(objectId)
                        for (const obj of object.result.result) {
                            if (obj.value.type === 'function'){
                                stack[this._getStackKey(callFrame)].local.functions[obj.name] = {}
                            } else {
                                stack[this._getStackKey(callFrame)].local[obj.name] = obj.value.value
                            }
                        }
                    }
                }
            }
        }
        console.log(stack)
        return stack
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
