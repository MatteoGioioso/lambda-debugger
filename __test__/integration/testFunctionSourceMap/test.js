const fs = require('fs')
const path = require('path')
const {handler} = require("./.serverless/index");
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

    const res = await handler(event, context)
    console.log(res)
})();
