const merge = require("webpack-merge");
const commonConfig = require('./webpack.common.config.js');

module.exports = merge(commonConfig, {
  output: {
    filename: 'convergence-mxgraph-adapter.global.js',
    libraryTarget: 'var'
  },
  externals: {
    "rxjs": "rxjs",
    "rxjs/operators": "rxjs.operators",
    "@convergence/convergence": "Convergence",
    "@convergence/color-assigner": "ConvergenceColorAssigner",
    "mxgraph": "window"
  }
});
