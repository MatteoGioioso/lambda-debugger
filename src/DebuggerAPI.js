const WebSocket = require('ws');
const {SourceMapsExtractor} = require("./SourceMapsExtractor");
const {logger} = require("./logger");

class DebuggerAPI {
    get sourceMaps() {
        return this._sourceMaps;
    }

    get files() {
        return this._files;
    }

    constructor({url}) {
        this._url = url
        this._PROJECT_ROOT = process.env.PROJECT_ROOT
        this._files = {};
        this._sourceMaps = {};
        this._eventListeners = {};
        this.messagesCodeNameSpace = {
            CONTINUE: 10,
            ENABLE: 11,
            SET_BREAK_POINT: 12,
            GET_SCRIPT_CODE: 13,
            GET_OBJECT: 14,
            STEP_OVER: 15,
            STEP_INTO: 16,
            RESUME: 17,
            GET_POSSIBLE_BREAKPOINTS: 18,
            STEP_OUT: 19,
            AWAIT_PROMISE: 20,
            ENABLE_ASYNC_TRACKING: 21,
            SET_SCRIPT_SOURCE: 22,
            PAUSE: 23,
            INSTRUMENTATION_BREAKPOINT: 24
        }
        this._instrBrk = false
        logger(this._PROJECT_ROOT)
    }

    initClient() {
        this._ws = new WebSocket(this._url, {
            perMessageDeflate: false
        })

        return new Promise((resolve, reject) => {
            this._ws.once('open', () => {
                resolve()
            })

            this._ws.on('error', (err) => {
                reject(err)
            })
        })
    }

    terminateClient() {
        // Clean up all the event listeners
        Object.keys(this._eventListeners).forEach(key => {
            this._ws.removeEventListener('message', this._eventListeners[key])
        })
        this._ws.close()
        this._files = {}
        this._eventListeners = {}
        this._sourceMaps = {}
    }

    _generateBigIntId(codeNamespace) {
        const bigInt = Math.floor(Math.random() * 10000000);
        return parseInt(`${codeNamespace}${bigInt}`)
    }

    _createPayload({method, id, params}) {
        return JSON.stringify({
            method, id, params
        })
    }

    async _setScriptSource(scriptId, scriptSource) {
        const id = this._generateBigIntId(this.messagesCodeNameSpace.SET_SCRIPT_SOURCE)
        this._ws.send(this._createPayload({
            method: 'Debugger.setScriptSource',
            params: {
                scriptId, scriptSource
            },
            id
        }))
        return this._attachTemporaryResponseEvent((data) => {
            if (data.id === id){
                console.log(data)
            }
            return data.id === id
        })
    }

    async setInstrumentationBreakpoint(){
        const id = this._generateBigIntId(this.messagesCodeNameSpace.INSTRUMENTATION_BREAKPOINT)
        this._ws.send(this._createPayload({
            method: 'Debugger.setInstrumentationBreakpoint',
            params: {
              instrumentation: 'beforeScriptWithSourceMapExecution'
            },
            id
        }))
        return this._attachTemporaryResponseEvent((data) => {
            return data.id === id
        })
    }

    async pause(){
        const id = this._generateBigIntId(this.messagesCodeNameSpace.PAUSE)
        this._ws.send(this._createPayload({
            method: 'Debugger.pause',
            id
        }))
        return this._attachTemporaryResponseEvent((data) => {
            return data.id === id
        })
    }

    async resume(){
        const id = this._generateBigIntId(this.messagesCodeNameSpace.RESUME)
        this._ws.send(this._createPayload({
            method: 'Debugger.resume',
            id
        }))
        return this._attachTemporaryResponseEvent((data) => {
            return data.id === id
        })
    }

    // This is an event listener
    collectSourceCode() {
        const eventListener = async (buffer) => {
            const data = JSON.parse(buffer)
            if (data.method === 'Debugger.scriptParsed' && this._shouldBeTracked(data.params.url)) {
                const currentFileKey = data.params.url
                logger(currentFileKey)

                if (!this._files[currentFileKey]) {
                    const source = await this.getScriptCode(data.params.scriptId)
                    const sourceMapUrl = data.params.sourceMapURL
                    this._files[currentFileKey] = {}
                    this._files[currentFileKey].code = source.result.scriptSource
                    this._files[currentFileKey].scriptId = data.params.scriptId
                    this._files[currentFileKey].sourceMapURL = sourceMapUrl
                    this._files[currentFileKey].hasSourceURL = data.params.hasSourceURL
                    this._files[currentFileKey].hasCode = true

                    if (sourceMapUrl) {
                        const jsonSourceMaps = await SourceMapsExtractor.loadFromBase64(sourceMapUrl)
                        const originalSource = await SourceMapsExtractor.getOriginalFileSourceCode(currentFileKey, jsonSourceMaps)
                        // this._files[currentFileKey].code = originalSource
                        // if (!this._instrBrk){
                        //     await this.setInstrumentationBreakpoint()
                        //     this._instrBrk = true
                        // }
                        this._sourceMaps[sourceMapUrl] = {}
                        this._sourceMaps[sourceMapUrl].code = jsonSourceMaps
                        this._sourceMaps[sourceMapUrl].hasCode = true
                        this._setScriptSource(data.params.scriptId, originalSource)
                    }
                }
            }

            if (data.error) {
                console.error(data.error)
            }
        }
        this._eventListeners = {
            collectSourceCodeEL: eventListener
        }
        this._ws.on('message', eventListener)
    }

    _attachTemporaryResponseEvent(conditionCallback) {
        return new Promise((resolve, reject) => {
            const eventListener = (buffer) => {
                const data = JSON.parse(buffer)
                if (conditionCallback(data)) {
                    this._ws.removeEventListener('message', eventListener)
                    return resolve(data)
                }

                if (conditionCallback(data) && data.error) {
                    this._ws.removeEventListener('message', eventListener)
                    console.error(data.error)
                    return reject(data.error)
                }
            }

            this._ws.on('message', eventListener)
        })
    }

    async enable() {
        const id = this._generateBigIntId(this.messagesCodeNameSpace.ENABLE)
        this._ws.send(this._createPayload({
            method: 'Debugger.enable',
            id
        }))
        return this._attachTemporaryResponseEvent(data => {
            return data.method === 'Debugger.scriptParsed' &&
                data.params.url.includes('node_modules/lambda-debugger/src/index.js')
        })
    }

    async setBreakpoint(lineNumber, scriptId) {
        const id = this._generateBigIntId(this.messagesCodeNameSpace.SET_BREAK_POINT)
        this._ws.send(JSON.stringify({
            method: 'Debugger.setBreakpoint',
            id,
            params: {
                location: {
                    scriptId,
                    lineNumber
                }
            }
        }))
        return this._attachTemporaryResponseEvent((data) => {
            return data.id === id
        })
    }

    getScriptCode(scriptId) {
        const id = this._generateBigIntId(this.messagesCodeNameSpace.GET_SCRIPT_CODE)
        this._ws.send(JSON.stringify({
            method: 'Debugger.getScriptSource',
            params: {scriptId},
            id
        }))
        return this._attachTemporaryResponseEvent((data) => {
            return data.id === id
        })
    }

    _getScopeChainObjects(objectId) {
        const id = this._generateBigIntId(this.messagesCodeNameSpace.GET_OBJECT)
        this._ws.send(JSON.stringify({
            method: 'Runtime.getProperties',
            params: {objectId},
            id
        }))
        return this._attachTemporaryResponseEvent((data) => {
            return data.id === id
        })
    }

    stepOver() {
        const id = this._generateBigIntId(this.messagesCodeNameSpace.STEP_OVER)
        this._ws.send(this._createPayload({id, method: 'Debugger.stepOver'}))

        return this._attachTemporaryResponseEvent(data => {
            return data.method === 'Debugger.paused'
        })
    }

    stepInto() {
        const id = this._generateBigIntId(this.messagesCodeNameSpace.STEP_INTO)
        this._ws.send(this._createPayload({id, method: 'Debugger.stepInto'}))

        return this._attachTemporaryResponseEvent(data => {
            return data.method === 'Debugger.paused'
        })
    }

    _shouldBeTracked(url) {
        // Exclude all node_modules, except the entrypoint of lambda-debugger
        return (url.includes(this._PROJECT_ROOT) &&
            !url.includes('/node_modules/')) ||
            url.includes('/node_modules/lambda-debugger/src/index.js')
    }

    _getLineNumber(callFrame) {
        // if (callFrame.functionName){
        //     return callFrame.functionLocation.lineNumber
        // }

        return callFrame.location.lineNumber

    }

    _getColumnNumber(callFrame){
        // if (callFrame.functionName){
        //     return callFrame.functionLocation.columnNumber
        // }

        return callFrame.location.columnNumber
    }

    _filterLocalScopeChain(callFrame) {
        return callFrame
            .scopeChain
            .filter(sc => sc.type === 'local' || sc.type === 'block' || sc.type === 'closure')
    }

    _getFileNameFromPath(callFrame) {
        const split = callFrame.url.split('/');
        return split.slice(-1)[0]
    }

    _getStackKey(callFrame) {
        const currentLineNumber = this._getLineNumber(callFrame)
        const functionName = callFrame.functionName
        const fileName = this._getFileNameFromPath(callFrame)
        return `${functionName || 'anonymous'}(), ${fileName}:${currentLineNumber}`
    }

    // Check if the current executed call is an internal file.
    // We do not record these events so we want to skip them
    _isTopOfTheStackInternal(callFrame) {
        const callFrameId = JSON.parse(callFrame.callFrameId)
        // ordinal is the stack order if 0 means that we are at the top
        return callFrameId.ordinal === 0 && !this._shouldBeTracked(callFrame.url)
    }

    _initStackFrame(stack, callFrame) {
        stack[this._getStackKey(callFrame)] = {
            meta: {
                currentPosition: {
                    line: this._getLineNumber(callFrame),
                    column: this._getColumnNumber(callFrame)
                },
            },
            file: callFrame.url,
            local: {
                functions: {},
            }
        }
    }

    _buildObjectTypes(obj) {
        const finalObject = {}
        const properties = obj.result.result
        for (const property of properties) {
            if (property.isOwn) {
                finalObject[property.name] = property.value && property.value.value
            }
        }

        return finalObject
    }

    async getStackForCurrentStep(stepOver) {
        let stack = {};
        let pausedExecutionMeta;
        if (stepOver) {
            pausedExecutionMeta = await this.stepOver()
        } else {
            pausedExecutionMeta = await this.stepInto()
        }

        for await (const callFrame of pausedExecutionMeta.params.callFrames) {
            // If the top of the stack is on an internal nodejs function
            // we will automatically step over the function call
            if (this._isTopOfTheStackInternal(callFrame)) {
                return this.getStackForCurrentStep(true)
            }

            if (!this._shouldBeTracked(callFrame.url)) continue;

            const callFrameId = JSON.parse(callFrame.callFrameId)
            this._initStackFrame(stack, callFrame)
            const localScopeChain = this._filterLocalScopeChain(callFrame)

            for await (const scope of localScopeChain) {
                stack[this._getStackKey(callFrame)].meta.ordinal = callFrameId.ordinal

                const objectId = scope.object.objectId
                const object = await this._getScopeChainObjects(objectId)

                for (const obj of object.result.result) {
                    switch (obj.value.type) {
                        case 'function':
                            stack[this._getStackKey(callFrame)].local.functions[obj.name] = {}
                            break;
                        case 'object':
                            const objData = await this._getScopeChainObjects(obj.value.objectId)
                            const objectType = this._buildObjectTypes(objData);
                            stack[this._getStackKey(callFrame)].local[obj.name] = objectType
                            break;
                        default:
                            stack[this._getStackKey(callFrame)]
                                .local[obj.name] = obj.value.value || 'undefined'
                    }
                }
            }
        }

        return stack
    }
}

module.exports = {
    DebuggerAPI
}
