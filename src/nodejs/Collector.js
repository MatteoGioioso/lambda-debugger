const fs = require('fs');
const S3 = require('aws-sdk/clients/s3')
const path = require('path');
const {logger} = require('./logger')

const s3Client = new S3();

class Collector {
    constructor() {
        this.OUTPUT_PATH = `/tmp/${process.env.LAMBDA_DEBUGGER_OUTPUT}`
        this.DEST_BUCKET = process.env.LAMBDA_DEBUGGER_DEST_BUCKET
        this.S3_NAME_SPACE = `${process.env.LAMBDA_DEBUGGER_OUTPUT}/${process.env.AWS_LAMBDA_FUNCTION_NAME}`
    }

    async cleanUpFiles(){
        const path = this.OUTPUT_PATH
        if (fs.existsSync(path)) {
            fs.readdirSync(path).forEach((file, index) => {
                const curPath = path.join(path, file);
                fs.unlinkSync(curPath);
                logger(`${file} deleted`)
            });
            fs.rmdirSync(path);
        }
        logger("/tmp directory is now empty")
    }

    async injectDebuggerOutputIntoHtml(executions, files){
        const html = await fs.promises.readFile(path.join(__dirname, 'index.html'), 'utf8');
        const debugData = JSON.stringify(executions, null, 2)
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
