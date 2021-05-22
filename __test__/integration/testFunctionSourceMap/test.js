// require('@babel/register')({
//     presets: [
//         [
//             "@babel/preset-env",
//             {
//                 targets: {
//                     node: "current"
//                 }
//             }
//         ]
//     ]
// });
import {handler} from "./index.js";

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
