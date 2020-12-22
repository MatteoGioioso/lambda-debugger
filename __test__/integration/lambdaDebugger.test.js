const fs = require('fs')
const path = require('path')
const {handler} = require("./testFunction/index");
const jsdom = require("jsdom");
const _ = require('lodash');
const {JSDOM} = jsdom;

/**
 * Deep diff between two object, using lodash
 * @param  {Object} object Object compared
 * @param  {Object} base   Object to compare with
 * @return {Object}        Return a new object who represent the diff
 */
function difference(object, base) {
    const diff = {}
    function changes(object, base) {
        return _.transform(object, function (result, value, key) {
            if (!_.isEqual(value, base[key])) {
                if (_.isObject(value) && _.isObject(base[key])) {
                    changes(value, base[key])
                } else {
                    // Pid always change across execution therefore we skip it
                    if (key === 'pid') return
                    diff[key] = value
                }
            }
        });
    }

    if (Array.isArray(object) && Array.isArray(base)){
        object.forEach((obj, index) => {
            changes(obj, base[index]);
            return diff
        })
    }

    changes(object, base);
    return diff
}

(async function () {
    const event = {
        "path": "/",
        "httpMethod": "GET",
        "queryStringParameters": null,
        "pathParameters": null,
        "body": null,
    }
    const context = {
        "memoryLimitInMB": "1024",
        "awsRequestId": "1g941419-eecf-41b8-8af2-09636522f86d"
    }

    await handler(event, context)

    const html = await fs
        .promises
        .readFile(path.join(__dirname, 'tmp/index.html'), 'utf8');
    const dom = new JSDOM(html);
    const executions = dom.window.document.getElementById('debug.json').innerHTML
    const snapshotExecutions = await fs
        .promises
        .readFile(path.join(__dirname, 'executions.json'), 'utf8')
    const files = dom.window.document.getElementById('files.json').innerHTML
    const snapshotFiles = await fs
        .promises
        .readFile(path.join(__dirname, 'files.json'), 'utf8')

    const filesDifferences = difference(JSON.parse(snapshotFiles), JSON.parse(files))
    const executionsDifferences = difference(JSON.parse(snapshotExecutions), JSON.parse(executions))

    if (!_.isEmpty(executionsDifferences)) {
        throw new Error(`Test failed, files do not match: ${JSON.stringify(executionsDifferences, null, 2)}`)
    }

    if (!_.isEmpty(filesDifferences)) {
        throw new Error(`Test failed, files do not match: ${JSON.stringify(filesDifferences, null, 2)}`)
    }
})();
