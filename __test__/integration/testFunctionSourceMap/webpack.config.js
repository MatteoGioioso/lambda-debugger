const path = require('path');
// const nodeExternals = require('webpack-node-externals');
// const slsw = require('serverless-webpack');

module.exports = {
    entry: './test.js',
    target: 'node',
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                    },
                },
                include: __dirname,
                exclude: /node_modules/,
            },
        ],
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'test.js',
        sourceMapFilename: 'test.map',
    }
};
