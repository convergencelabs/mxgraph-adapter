// rollup.config.js
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import license from "rollup-plugin-license";
import {terser} from "rollup-plugin-terser";
import path from "path";

import pkg from './package.json';

//
// Commons Settings
//
const input = 'src/ts/index.ts';

const plugins = [
  resolve(),
  commonjs(),
  typescript(),
  license({
    banner: {
      commentStyle: 'ignored', // The default
      content: {
        file: path.join(__dirname, 'copyright-header.txt'),
      },
    }
  })
];

const moduleName = "ConvergenceMxGraphAdapter";
const format = "umd";

const external = [
  "rxjs",
  "rxjs/operators",
  "@convergence/convergence",
  "@convergence/color-assigner",
  "mxgraph"
]

const globals = {
  "rxjs": "rxjs",
  "rxjs/operators": "rxjs.operators",
  "@convergence/convergence": "Convergence",
  "@convergence/color-assigner": "ConvergenceColorAssigner",
  "mxgraph": "window"
}

export default [{
  input,
  plugins,
  external,
  output: [
    {
      name: moduleName,
      file: pkg.browser,
      format,
      sourcemap: true,
      globals
    }
  ]
}, {
  input,
  plugins: [...plugins, terser()],
  external,
  output: [
    {
      name: moduleName,
      file: `${path.dirname(pkg.browser)}/${path.basename(pkg.browser, ".js")}.min.js`,
      format,
      sourcemap: true,
      globals
    }
  ]
}];