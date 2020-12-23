const fs = require('fs')
const path = require('path')
const SourceMapConsumer = require('source-map').SourceMapConsumer

class SourceMapsExtractor {
    constructor(sourceMapsFile) {
        this._sourceMapsFile = sourceMapsFile
        this._sourceMapsFileContent = null
    }

    async loadFromFile() {
        const data = await fs
            .promises
            .readFile(this._sourceMapsFile, 'utf8')
        this._sourceMapsFileContent = data
        return data
    }

    async getSourceOriginalSourceCodeForFile(){
        const consumer = await new SourceMapConsumer(this._sourceMapsFileContent);

        consumer.destroy()
    }
}
