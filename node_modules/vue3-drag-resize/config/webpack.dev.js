const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const paths = require('./paths');

module.exports = merge(common, {
    // Set the mode to development or production
    mode: 'development',

    // Control how source maps are generated
    devtool: 'inline-source-map',

    // Spin up a server for quick development
    devServer: {
        historyApiFallback: true,
        contentBase: [paths.build, paths.public],
        open: true,
        compress: false,
        hot: true,
        port: 8080,
    },

    entry: [paths.src + '/demo/app.js'],

    output: {
        path: paths.build,
        filename: '[name].bundle.js',
        publicPath: '/',
    },

    module: {
        rules: [
            // Styles: Inject CSS into the head with source maps
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader', options: {
                            sourceMap: true,
                            importLoaders: 2,
                            modules: false,
                        },
                    },
                    { loader: 'postcss-loader', options: { sourceMap: true } },
                ],
            },
        ],
    },

    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: paths.public,
                    to: 'assets',
                    globOptions: {
                        ignore: ['*.DS_Store'],
                    },
                    noErrorOnMissing: true,
                },
            ],
        }),
        new HtmlWebpackPlugin({
            title: 'vue-drag-resize',
            // favicon: paths.src + '/images/favicon.png',
            template: paths.src + '/demo/template.html', // template file
            filename: 'index.html', // output file
        }),
    ],
});
