import { join, extname } from 'path';
import {
  vfs,
  signale,
  through,
  gulpTs,
  gulpLess,
  gulpPlumber,
  gulpIf,
} from '../utils';
import { BabelOptions } from '../../typings/babel';
import getTSConfig from './getTsConfig';
import babelTransform from './babelTransform';

function createStream(babelOptions: BabelOptions, patterns: string[]) {
  const {
    cwd,
    rootPath,
    watch,
    type,
    bundleOpts: { disableTypeCheck, lessInBabelMode },
  } = babelOptions;

  const srcPath = join(cwd, 'src');

  const tsConfig = getTSConfig(cwd, rootPath);

  const targetDir = type === 'esm' ? 'es' : 'dist';

  const targetPath = join(cwd, targetDir);

  const babelTransformRegexp = disableTypeCheck ? /\.(t|j)sx?$/ : /\.jsx?$/;

  return vfs
    .src(patterns, {
      allowEmpty: true,
      base: srcPath,
    })
    .pipe(watch ? gulpPlumber() : through.obj())
    .pipe(
      gulpIf(
        (f) =>
          !disableTypeCheck &&
          /\.tsx?$/.test(f.path) &&
          !f.path.endsWith('.d.ts'),
        gulpTs(tsConfig),
      ),
    )
    .pipe(
      gulpIf(
        (f) => lessInBabelMode && /\.less$/.test(f.path),
        gulpLess(lessInBabelMode || {}),
      ),
    )
    .pipe(
      gulpIf(
        (f) => babelTransformRegexp.test(f.path) && !f.path.endsWith('.d.ts'),
        through.obj((file, env, cb) => {
          try {
            file.contents = Buffer.from(
              babelTransform(
                {
                  file,
                  type,
                },
                babelOptions,
              ),
            );
            // .jsx -> .js
            file.path = file.path.replace(extname(file.path), '.js');
            cb(null, file);
          } catch (e) {
            signale.error(`Compiled faild: ${file.path}`);
            console.log(e);
            cb(null);
          }
        }),
      ),
    )
    .pipe(vfs.dest(targetPath));
}

export default createStream;
