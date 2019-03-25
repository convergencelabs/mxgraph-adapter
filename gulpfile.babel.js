import {src, dest, series} from "gulp";
import insert from "gulp-insert";
import webpackStream from "webpack-stream";
import webpack from "webpack";
import rename from "gulp-rename";
import uglify from "gulp-uglify-es";
import sourceMaps from "gulp-sourcemaps";
import del from "del";
import header from "gulp-header";
import trim from "trim";
import filter from 'gulp-filter-each';
import fs from "fs";
import gulpTypescript from "gulp-typescript";
import typescript from "typescript";
const tsProject = gulpTypescript.createProject("tsconfig.json", {
  declaration: true,
  typescript: typescript
});

const exportFilter = "export {};";

const copyFiles = () =>
  src(["README.md", "LICENSE.txt", "package.json"])
    .pipe(dest("dist"));

const copyDocs = () =>
  src(["docs/**/*"])
    .pipe(dest("dist/docs"));

const amd = () => {
  return bundle("./webpack/webpack.amd.config.js");
};

const global = () => {
 return bundle("./webpack/webpack.global.config.js");
};

const bundle = (config) => {
  const packageJson = JSON.parse(fs.readFileSync("./package.json"));
  const headerTxt = fs.readFileSync("./copyright-header.txt");

  return src("./src/ts/index.ts")
    .pipe(webpackStream(require(config), webpack))
    .pipe(header(headerTxt, {package: packageJson}))
    .pipe(dest("dist/bundles"));
}

function minify() {
  return src([`dist/bundles/*.js`, `!dist/bundles/*.min.js`])
    .pipe(sourceMaps.init())
    .pipe(uglify({
      mangle: {
        properties: {
          regex: /^_/
        }
      }
    }))
    .pipe(rename({
      suffix: ".min"
    }))
    .pipe(sourceMaps.write("."))
    .pipe(dest("dist/bundles"));
}

const commonjs = () => {
  const tsProject = gulpTypescript.createProject("tsconfig.json", {
    module: "commonjs",
    typescript: typescript
  });

  return src("src/**/*.ts")
    .pipe(tsProject())
    .js
    .pipe(filter(content => trim(content).length !== 0))
    .pipe(dest("dist/lib"));
};

const es6 = () => {
  const tsProject = gulpTypescript.createProject("tsconfig.json", {
    module: "es6",
    typescript: typescript
  });

  return src("src/**/*.ts")
    .pipe(tsProject())
    .js
    .pipe(filter(content => trim(content).length !== 0))
    .pipe(dest("dist/es6"));
};

const typings = () =>
  src(["src/ts/*.ts", "src/types/*.d.ts"])
    .pipe(tsProject())
    .dts
    .pipe(filter(content => trim(content) !== exportFilter))
    .pipe(dest("dist/typings"));

const appendTypingsNamespace = () =>
  src("dist/typings/index.d.ts", {base: './'})
    .pipe(insert.append('\nexport as namespace ConvergenceMxGraphAdapter;\n'))
    .pipe(dest("./"));

const clean = () => del(["dist"]);

const dist = series([
  commonjs,
  es6,
  amd,
  global,
  typings,
  appendTypingsNamespace,
  minify,
  copyFiles,
  copyDocs]);

export {
  dist,
  clean
}
