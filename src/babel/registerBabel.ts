import { join } from 'path';
import { slash } from '../utils';
import getBabelConfig from './getBabelConfig';

function registerBabel(cwd: string, only: string[]) {
  const { config: babelConfig } = getBabelConfig({
    target: 'node',
    typescript: true,
  });
  require('@babel/register')({
    ...babelConfig,
    extensions: ['.es6', '.es', '.jsx', '.js', '.mjs', '.ts', '.tsx'],
    only: only.map((file) => slash(join(cwd, file))),
    babelrc: false,
    cache: false,
  });
}

export default registerBabel;
