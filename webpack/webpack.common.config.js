const path = require('path');

module.exports = {
  mode: "production",
  optimization: {
    minimize: false
  },
  devtool: "source-map",
  entry: './src/ts/index.ts',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    path: path.resolve(__dirname, '../dist/bundles'),
    library: 'ConvergenceMxGraphAdapter'
  }
};
