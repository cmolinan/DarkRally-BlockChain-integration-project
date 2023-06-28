const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },  
  devtool: "eval-source-map",
  mode: "development",
  entry: "./src/index.js",
  devServer: {
    static: "./dist",
    hot: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "Interacting with smart contract",
      template: "index.html",
    }),
  ],
  output: {
    filename: "[name].bundle.js",
    clean: true,
  },
};
