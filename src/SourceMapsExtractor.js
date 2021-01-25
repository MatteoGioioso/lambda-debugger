const fs = require('fs')
const convert = require('convert-source-map');
const SourceMapConsumer = require('source-map').SourceMapConsumer

class SourceMapsExtractor {
    static async loadFromFile(sourceMapsFileUrl) {
        return await fs
            .promises
            .readFile(sourceMapsFileUrl, 'utf8')
    }

    static async loadFromBase64(inlineSourceMapBase64){
        const sourceMapsBase64 = inlineSourceMapBase64
            .replace('data:application/json;charset=utf-8;base64,', '')
        return convert.fromBase64(sourceMapsBase64).toJSON();
    }

    static async getOriginalFileSourceCode(sourceScriptUrl, sourceMapContent){
        const url = sourceScriptUrl.replace('file://', '')
        const consumer = await new SourceMapConsumer(sourceMapContent, null);
        const originalSource = consumer.sourceContentFor(url);
        consumer.destroy()
        return originalSource
    }

    static async getOptimalLocation(location, sourceMapContent) {
        const consumer = await new SourceMapConsumer(sourceMapContent, null);
        const original = consumer.originalPositionFor({
            line: location.line,
            column: location.column,
            bias: SourceMapConsumer.GREATEST_LOWER_BOUND
        })
        if (original.line !== null){
            return original
        }

        const leastOriginal = consumer.originalPositionFor({
            line: location.line,
            column: location.column,
            bias: SourceMapConsumer.LEAST_UPPER_BOUND
        })

        consumer.destroy()
        return leastOriginal
    }
}

module.exports = {
    SourceMapsExtractor
}
