const path = require('path');
const AwsSamPlugin = require('aws-sam-webpack-plugin');
const fs = require('fs');
const TerserPlugin = require('terser-webpack-plugin');
// const nodeExternals = require('webpack-node-externals');
const { LicenseWebpackPlugin } = require('license-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const awsSamPlugin = new AwsSamPlugin();

module.exports = {
  // Loads the entry object from the AWS::Serverless::Function resources in your
  // SAM config. Setting this to a function will
  entry: () => awsSamPlugin.entry(),

  // Write the output to the .aws-sam/build folder
  output: {
    filename: (chunkData) => awsSamPlugin.filename(chunkData),
    libraryTarget: 'commonjs2',
    path: path.resolve('.'),
  },

  // Create source maps
  // devtool: 'source-map',

  // Target node
  target: 'node',

  // AWS recommends always including the aws-sdk in your Lambda package but excluding can significantly reduce
  // the size of your deployment package. If you want to always include it then comment out this line. It has
  // been included conditionally because the node10.x docker image used by SAM local doesn't include it.
  externalsPresets: { node: true },

  // Its apparently recommended to include AWS in the bundle, although we can reduce the size by only requiring the clients we need
  // externals: process.env.NODE_ENV === 'development' ? [] : ['aws-sdk'],

  // Set the webpack mode
  mode: process.env.NODE_ENV || 'production',

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
          },
        ],
      },
    ],
  },

  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        // cache: true,
        // parallel: false,
        // sourceMap: process.env.NODE_ENV !== 'production',
        terserOptions: {
          // https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
          // extractComments: 'all',

          output: {
            comments: false,
            preamble:
              '// Copyright 2019-2023 First Coders LTD - All Rights Reserved\n// This software package is available under a commercial license.\n// License at LICENCE.txt',
          },
          // extractComments: {
          //   condition: /^\**!|@preserve|@license|@cc_on/i,
          //   // filename: (file, fileData) => {
          //   //   // ⚠ webpack 5: there is only fileData parameter

          //   //   // A file can contain a query string (for example when you have `output.filename: '[name].js?[chunkhash]'`)
          //   //   // You must consider this
          //   //   // The "fileData" argument contains object with "filename", "basename", "query"
          //   //   return file.replace(/\.(\w+)($|\?)/, '.$1.LICENSE.txt$2');
          //   // },
          // },

          // https://github.com/terser/terser#minify-options
          nameCache: {},
          compress: {
            passes: 2,
            // arrows: false,
            // collapse_vars: false,
            // comparisons: false,
            // computed_props: false,
            hoist_funs: true,
            // hoist_props: false,
            hoist_vars: true,
            // inline: false,
            // loops: false,
            // negate_iife: false,
            properties: false,
            // reduce_funcs: false,
            // reduce_vars: false,
            // switches: false,
            // toplevel: false,
            // typeofs: false,
            // booleans: true,
            // if_return: true,
            // sequences: true,
            // unused: true,
            // conditionals: true,
            // dead_code: true,
            // evaluate: true,
          },
          mangle: {
            // TODO
            // don't mangle properties again
          },
          // banner: (commentsFile) => {
          //   return `My custom banner about license information ${commentsFile}`;
          // },
          // ecma: '2015',
        },
      }),
    ],
  },

  plugins: [
    awsSamPlugin,
    new LicenseWebpackPlugin({
      stats: {
        warnings: true,
        errors: true,
      },
      unacceptableLicenseTest: (licenseType) =>
        licenseType && licenseType.toUpperCase().indexOf('GPL') !== -1,
      perChunkOutput: false,
      outputFilename: '.aws-sam/build/LICENSE.txt',
      excludedPackageTest: (packageName) =>
        ['webpack', 'aws-sdk', '@soundws/utils', '@soundws/service-utils'].indexOf(packageName) !==
        -1,
      renderLicenses: (modules) => {
        const license = fs.readFileSync(path.join(__dirname, 'LICENSE.txt'));

        const thirdParty = modules
          .map(
            (p) =>
              `This product bundles "${p.name}", which is available under a "${p.licenseId}" license:\n\n${p.licenseText}\n`
          )
          .join('\n');

        return `${license}\n${thirdParty}`;
      },
    }),

    new CopyPlugin({
      patterns: [{ from: 'README.md', to: '.aws-sam/build/README.md' }],
    }),
  ],
};
