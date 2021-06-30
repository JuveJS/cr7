import { relative } from 'path';
import * as babel from '@babel/core';
import { slash, chalk } from '../utils/index';
import getBabelConfig from './getBabelconfig';
import { BabelOptions, BabelTransformOptions } from '../../typings/babel';

function transform(
  transformOptions: BabelTransformOptions,
  babelOptions: BabelOptions,
) {
  const { file, type } = transformOptions;

  const { cwd, importLibToEs, log, bundleOpts } = babelOptions;
  const {
    target = 'browser',
    runtimeHelpers,
    extraBabelPresets = [],
    extraBabelPlugins = [],
    browserFiles = [],
    nodeFiles = [],
    nodeVersion,
    cjs,
    lessInBabelMode,
  } = bundleOpts;
  const { config: babelConfig, isBrowser } = getBabelConfig({
    target,
    type,
    typescript: true,
    runtimeHelpers,
    filePath: slash(relative(cwd, file.path)),
    browserFiles,
    nodeFiles,
    nodeVersion,
    // @ts-ignore
    lazy: cjs && cjs.lazy,
    lessInBabelMode,
  });
  if (importLibToEs && type === 'esm') {
    babelConfig.plugins.push(
      // TODO change path
      require.resolve('../lib/transform-import-lib-to-es'),
    );
  }
  babelConfig.presets.push(...extraBabelPresets);
  babelConfig.plugins.push(...extraBabelPlugins);

  const relFile = slash(file.path).replace(`${cwd}/`, '');
  log(
    `Transform to ${type} for ${chalk[isBrowser ? 'yellow' : 'blue'](relFile)}`,
  );

  return babel.transform(file.contents, {
    ...babelConfig,
    filename: file.path,
    // 不读取外部的babel.config.js配置文件，全采用babelOpts中的babel配置来构建
    configFile: false,
  }).code;
}

export default transform;
