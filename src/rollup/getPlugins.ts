import { extname, join } from 'path';
import { existsSync } from 'fs';
import url from '@rollup/plugin-url';
import svgr from '@svgr/rollup';
import postcss from 'rollup-plugin-postcss';
import NpmImport from 'less-plugin-npm-import';
import autoprefixer from 'autoprefixer';
import inject, { RollupInjectOptions } from '@rollup/plugin-inject';
import replace from '@rollup/plugin-replace';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript2 from 'rollup-plugin-typescript2';
import tempDir from 'temp-dir';
import json from '@rollup/plugin-json';
import babel, { RollupBabelInputPluginOptions } from '@rollup/plugin-babel';
import getBabelConfig from '../babel/getBabelconfig';

import { RollupConfig } from '../../typings/rollup';

function getPlugins(
  opts = {} as { minCSS: boolean },
  rollupConfig: RollupConfig,
) {
  const { minCSS } = opts;
  const { bundleOpts, entry, cwd, rootPath, type, importLibToEs } =
    rollupConfig;
  const {
    target = 'browser',
    extractCSS = false,
    injectCSS = true,
    cssModules: modules,
    extraPostCSSPlugins = [],
    extraRollupPlugins = [],
    extraBabelPresets = [],
    extraBabelPlugins = [],
    autoprefixer: autoprefixerOpts,
    runtimeHelpers: runtimeHelpersOpts,
    replace: replaceOpts,
    inject: injectOpts,
    nodeVersion,
    typescriptOpts,
    nodeResolveOpts = {},
    disableTypeCheck,
    lessInRollupMode = {},
    sassInRollupMode = {},
  } = bundleOpts;

  const entryExt = extname(entry);
  const extensions = ['.js', '.jsx', '.ts', '.tsx', '.es6', '.es', '.mjs'];
  const isTypeScript = entryExt === '.ts' || entryExt === '.tsx';
  const runtimeHelpers = type === 'cjs' ? false : runtimeHelpersOpts;

  const babelConfig = {
    ...getBabelConfig({
      type,
      target: type === 'esm' ? 'browser' : target,
      typescript: true,
      runtimeHelpers,
      nodeVersion,
    }).config,
    // ref: https://github.com/rollup/plugins/tree/master/packages/babel#babelhelpers
    babelHelpers: (runtimeHelpers
      ? 'runtime'
      : 'bundled') as RollupBabelInputPluginOptions['babelHelpers'],
    exclude: /\/node_modules\//,
    babelrc: false,
    // ref: https://github.com/rollup/rollup-plugin-babel#usage
    extensions,
  };
  if (importLibToEs && type === 'esm') {
    babelConfig.plugins.push(require.resolve('../lib/transform-import-lib-to-es'));
  }
  babelConfig.presets.push(...extraBabelPresets);
  babelConfig.plugins.push(...extraBabelPlugins);

  return [
    url(),
    svgr(),
    postcss({
      extract: extractCSS,
      inject: injectCSS,
      modules,
      // modules => all .less will convert into css modules
      ...(modules ? { autoModules: false } : {}),
      minimize: !!minCSS,
      use: {
        less: {
          plugins: [new NpmImport({ prefix: '~' })],
          javascriptEnabled: true,
          ...lessInRollupMode,
        },
        sass: {
          ...sassInRollupMode,
        },
        stylus: false,
      },
      plugins: [
        autoprefixer({
          // https://github.com/postcss/autoprefixer/issues/776
          remove: false,
          ...autoprefixerOpts,
        }),
        ...extraPostCSSPlugins,
      ],
    }),
    ...(injectOpts ? [inject(injectOpts as RollupInjectOptions)] : []),
    ...(replaceOpts && Object.keys(replaceOpts || {}).length
      ? [replace(replaceOpts)]
      : []),
    nodeResolve({
      mainFields: ['module', 'jsnext:main', 'main'],
      extensions,
      ...nodeResolveOpts,
    }),
    ...(isTypeScript
      ? [
          typescript2({
            cwd,
            // @see https://github.com/umijs/father/issues/61#issuecomment-544822774
            clean: true,
            cacheRoot: `${tempDir}/.rollup_plugin_typescript2_cache`,
            // 支持往上找 tsconfig.json
            // 比如 lerna 的场景不需要每个 package 有个 tsconfig.json
            tsconfig: [
              join(cwd, 'tsconfig.json'),
              join(rootPath, 'tsconfig.json'),
            ].find(existsSync),
            tsconfigDefaults: {
              compilerOptions: {
                // Generate declaration files by default
                declaration: true,
              },
            },
            tsconfigOverride: {
              compilerOptions: {
                // Support dynamic import
                target: 'esnext',
              },
            },
            check: !disableTypeCheck,
            ...(typescriptOpts || {}),
          }),
        ]
      : []),
    babel(babelConfig),
    json(),
    ...(extraRollupPlugins || []),
  ];
}

export default getPlugins;
