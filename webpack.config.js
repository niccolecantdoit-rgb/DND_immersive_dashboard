const path = require('path');
const webpack = require('webpack');
const fs = require('fs');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'DND_Dashboard_Immersive.user.js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'none', // Prevent default minification to keep it readable, or use 'production'
  plugins: [
    new webpack.BannerPlugin({
      banner: fs.readFileSync('./src/header.js', 'utf-8'),
      raw: true,
      entryOnly: true
    })
  ],
  optimization: {
    minimize: false // UserScripts are often better non-minified for review, but can be minified if preferred
  }
};
