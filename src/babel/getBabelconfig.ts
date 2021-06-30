import { extname } from 'path';
import transformImportLessToCss from './plugins/transform-import-less-to-css';
import { BabelConfig } from '../../typings/babel';

const getBabelConfig = (config: BabelConfig) => {
  const {
    target,
    typescript,
    type,
    runtimeHelpers,
    filePath,
    browserFiles,
    nodeFiles,
    nodeVersion,
    lazy,
    lessInBabelMode,
  } = config;
  let isBrowser = target === 'browser';
  // rollup 场景下不会传入 filePath
  if (filePath) {
    if (extname(filePath) === '.tsx' || extname(filePath) === '.jsx') {
      isBrowser = true;
    } else {
      if (isBrowser) {
        if (nodeFiles.includes(filePath)) isBrowser = false;
      } else {
        if (browserFiles.includes(filePath)) isBrowser = true;
      }
    }
  }
  const targets = isBrowser
    ? { browsers: ['last 2 versions', 'IE 10'] }
    : { node: nodeVersion || 6 };

  return {
    config: {
      presets: [
        ...(typescript ? [require.resolve('@babel/preset-typescript')] : []),
        [
          require.resolve('@babel/preset-env'),
          {
            targets,
            modules: type === 'esm' ? false : 'auto',
          },
        ],
        ...(isBrowser ? [require.resolve('@babel/preset-react')] : []),
      ],
      plugins: [
        ...(type === 'cjs' && lazy && !isBrowser
          ? [
              [
                require.resolve('@babel/plugin-transform-modules-commonjs'),
                {
                  lazy: true,
                },
              ],
            ]
          : []),
        ...(lessInBabelMode ? [transformImportLessToCss] : []),
        require.resolve('babel-plugin-react-require'),
        require.resolve('@babel/plugin-syntax-dynamic-import'),
        require.resolve('@babel/plugin-proposal-export-default-from'),
        require.resolve('@babel/plugin-proposal-export-namespace-from'),
        require.resolve('@babel/plugin-proposal-do-expressions'),
        require.resolve('@babel/plugin-proposal-nullish-coalescing-operator'),
        require.resolve('@babel/plugin-proposal-optional-chaining'),
        [
          require.resolve('@babel/plugin-proposal-decorators'),
          { legacy: true },
        ],
        [
          require.resolve('@babel/plugin-proposal-class-properties'),
          { loose: true },
        ],
        ...(runtimeHelpers
          ? [
              [
                require.resolve('@babel/plugin-transform-runtime'),
                {
                  useESModules: isBrowser && type === 'esm',
                  version: require('@babel/runtime/package.json').version,
                },
              ],
            ]
          : []),
        ...(process.env.COVERAGE
          ? [require.resolve('babel-plugin-istanbul')]
          : []),
      ],
    },
    isBrowser,
  };
};
export default getBabelConfig;
