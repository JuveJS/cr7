import { basename, extname, join } from 'path';
import { RollupOptions } from 'rollup';
import replace from '@rollup/plugin-replace';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import { camelCase } from 'lodash';
import { RollupConfig } from '../../typings/rollup';
import getPlugins from './getPlugins';
import { Package } from '../../typings';

function getRollupConfig(config: RollupConfig): RollupOptions[] {
  const { type, entry, cwd, bundleOpts } = config;
  const {
    umd,
    esm,
    cjs,
    file,
    include = /node_modules/,
    extraExternals = [],
    externalsExclude = [],
  } = bundleOpts;
  const entryExt = extname(entry);
  const name = file || basename(entry, entryExt);

  let pkg = {} as Package;
  try {
    pkg = require(join(cwd, 'package.json')); // eslint-disable-line
  } catch (e) {}

  // rollup configs
  const input = join(cwd, entry);
  const format = type;

  // ref: https://rollupjs.org/guide/en#external
  // 潜在问题：引用包的子文件时会报 warning，比如 @babel/runtime/helpers/esm/createClass
  // 解决方案：可以用 function 处理
  const external = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    ...extraExternals,
  ];
  const externalPeerDeps = [
    ...Object.keys(pkg.peerDependencies || {}),
    ...extraExternals,
  ];

  function getPkgNameByid(id) {
    const splitted = id.split('/');
    if (id.charAt(0) === '@' && splitted[0] !== '@' && splitted[0] !== '@tmp') {
      return splitted.slice(0, 2).join('/');
    } else {
      return id.split('/')[0];
    }
  }

  function testExternal(pkgs, excludes, id) {
    if (excludes.includes(id)) {
      return false;
    }
    return pkgs.includes(getPkgNameByid(id));
  }

  const terserOpts = {
    compress: {
      pure_getters: true,
      unsafe: true,
      unsafe_comps: true,
      warnings: false,
    },
  };

  switch (type) {
    case 'esm':
      let output: Record<string, any> = {
        file: join(
          cwd,
          `dist/${(esm && (esm as any).file) || `${name}.esm`}.js`,
        ),
      };
      // https://rollupjs.org/guide/en/#code-splitting
      if (entry.length > 1) {
        output = {
          dir: (esm && (esm as any).dir) || 'dist',
          entryFileNames: `${name}.esm.js`,
        };
      }
      return [
        {
          input,
          output: {
            format,
            ...output,
          },
          plugins: [
            ...getPlugins(null, config),
            ...(esm && (esm as any).minify ? [terser(terserOpts)] : []),
          ],
          external: testExternal.bind(null, external, externalsExclude),
        },
        ...(esm && (esm as any).mjs
          ? [
              {
                input,
                output: {
                  format,
                  file: join(
                    cwd,
                    `dist/${(esm && (esm as any).file) || `${name}`}.mjs`,
                  ),
                },
                plugins: [
                  ...getPlugins(null, config),
                  replace({
                    'process.env.NODE_ENV': JSON.stringify('production'),
                  }),
                  terser(terserOpts),
                ],
                external: testExternal.bind(
                  null,
                  externalPeerDeps,
                  externalsExclude,
                ),
              },
            ]
          : []),
      ];

    case 'cjs':
      return [
        {
          input,
          output: {
            format,
            file: join(cwd, `dist/${(cjs && (cjs as any).file) || name}.js`),
          },
          plugins: [
            ...getPlugins(null, config),
            ...(cjs && (cjs as any).minify ? [terser(terserOpts)] : []),
          ],
          external: testExternal.bind(null, external, externalsExclude),
        },
      ];

    case 'umd':
      // Add umd related plugins
      const extraUmdPlugins = [
        commonjs({
          include,
          // namedExports options has been remove from https://github.com/rollup/plugins/pull/149
        }),
      ];

      return [
        {
          input,
          output: {
            format,
            sourcemap: umd && umd.sourcemap,
            file: join(cwd, `dist/${(umd && umd.file) || `${name}.umd`}.js`),
            globals: umd && umd.globals,
            name:
              (umd && umd.name) || (pkg.name && camelCase(basename(pkg.name))),
          },
          plugins: [
            ...getPlugins(null, config),
            ...extraUmdPlugins,
            replace({
              'process.env.NODE_ENV': JSON.stringify('development'),
            }),
          ],
          external: testExternal.bind(null, externalPeerDeps, externalsExclude),
        },
        ...(umd && umd.minFile === false
          ? []
          : [
              {
                input,
                output: {
                  format,
                  sourcemap: umd && umd.sourcemap,
                  file: join(
                    cwd,
                    `dist/${(umd && umd.file) || `${name}.umd`}.min.js`,
                  ),
                  globals: umd && umd.globals,
                  name:
                    (umd && umd.name) ||
                    (pkg.name && camelCase(basename(pkg.name))),
                },
                plugins: [
                  ...getPlugins({ minCSS: true }, config),
                  ...extraUmdPlugins,
                  replace({
                    'process.env.NODE_ENV': JSON.stringify('production'),
                  }),
                  terser(terserOpts),
                ],
                external: testExternal.bind(
                  null,
                  externalPeerDeps,
                  externalsExclude,
                ),
              },
            ]),
      ];

    default:
      throw new Error(`Unsupported type ${type}`);
  }
}

export default getRollupConfig;
