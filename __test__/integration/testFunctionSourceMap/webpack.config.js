const path = require('path');
// const nodeExternals = require('webpack-node-externals');
const slsw = require('serverless-webpack');
const { ThundraWebpackPlugin } = require('@thundra/webpack-plugin');

module.exports = {
    entry: slsw.lib.entries,
    target: 'node',
    devtool: 'source-map',
    plugins: [new ThundraWebpackPlugin([
        'index.handler*[traceArgs=true,traceReturnValue=true,traceLineByLine=true]',
    ])],
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
        libraryTarget: 'commonjs2',
        path: path.join(__dirname, '.webpack'),
        filename: '[name].js',
        sourceMapFilename: '[file].map',
    },
};
