const path = require('path');
const nodeExternals = require('webpack-node-externals');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const JavaScriptObfuscator = require('webpack-obfuscator');


module.exports = {
    mode: 'production',
    target: 'node',
    entry: {
        script: path.resolve(__dirname, './public/script.js')
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'js/[name].[contenthash].js'
    },

    module:{
        rules:[
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
            },
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,//替换style-loader
                    'css-loader']
            },

        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, './public/templates/index_template.html'),
            filename: 'index.html'
        }),
        new MiniCssExtractPlugin({
            filename: 'css/[name].[contenthash].css'
        })
    ],
    // 添加加密配置
    optimization: {
        minimizer: [
            new JavaScriptObfuscator({
                rotateUnicodeArray: true,
                selfDefending: true,
                // 可以根据需要调整其他加密选项
            }, ['excluded_bundle_name.js'])
        ]
    }
};
