const fs = require('fs');
const S3 = require('aws-sdk/clients/s3')
const path = require('path');
const {logger} = require('./logger')

const s3Client = new S3();

class Collector {
    constructor() {
        this.OUTPUT_PATH = path.join('/tmp', process.env.LAMBDA_DEBUGGER_OUTPUT)
        this.DEST_BUCKET = process.env.LAMBDA_DEBUGGER_DEST_BUCKET
        this.S3_NAME_SPACE = path.join(
            process.env.LAMBDA_DEBUGGER_OUTPUT,
            process.env.AWS_LAMBDA_FUNCTION_NAME
        )
    }

    async cleanUpFiles(){
        const outputPath = this.OUTPUT_PATH
        if (fs.existsSync(outputPath)) {
            fs.readdirSync(outputPath).forEach((file, index) => {
                const curPath = path.join(outputPath, file);
                fs.unlinkSync(curPath);
                logger(`${file} deleted`)
            });
            fs.rmdirSync(outputPath);
        }
        logger("/tmp directory is now empty")
    }

    async injectDebuggerOutputIntoHtml(executions, files){
        // Cut the custom runtime executions and hide it from the user
        // As long as the runtime does not change it's implementation the position
        // are going to be the same.
        const onlyFunctionsExecution = executions.slice(2).slice(0, -1)
        const html = await fs.promises.readFile(path.join(__dirname, 'index.html'), 'utf8');
        const debugData = JSON.stringify(onlyFunctionsExecution, null, 2)
        const filesData = JSON.stringify(files, null, 2)
        const newHtml = html
            .replace('//---DEBUG.JSON---//', debugData)
            .replace('//---FILES.JSON---//', filesData)

        await fs.promises.writeFile(path.join(this.OUTPUT_PATH, '/index.html'), newHtml)
    }

    async sendToDest(){
        const requests = [];
        const hash = Date.now().toString()

        fs.readdirSync(this.OUTPUT_PATH).forEach((file, index) => {
            const curPath = path.join(this.OUTPUT_PATH, file)
            const data = fs.readFileSync(curPath)
            const key = `${this.S3_NAME_SPACE}/${hash}/${file}`
            requests.push(this._uploadToS3(key, data))
        });

        await Promise.all(requests)
        logger("Debugger output upload completed!")
    }

    async _uploadToS3(key, data){
        const params = {
            Bucket: this.DEST_BUCKET,
            Key: key,
            Body: data,
        };

        const res = await s3Client.upload(params).promise()
        logger(res.Key + " uploaded")
    }
}

module.exports = {
    Collector
}
