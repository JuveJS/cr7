import { existsSync, statSync } from 'fs';
import lodash from 'lodash';
import { rimraf, slash, chokidar, chalk } from '../utils';
import { BabelOptions } from '../../typings/babel';
import createStream from './createStream';
import { getPatterns } from './patterns';
import { join } from 'path';

async function babelBuild(babelOptions: BabelOptions) {
  const { cwd, type, watch, dispose, log } = babelOptions;

  const srcPath = join(cwd, 'src');

  const targetDir = type === 'esm' ? 'es' : 'lib';

  const targetPath = join(cwd, targetDir);

  log(chalk.gray(`Clean ${targetDir} directory`));

  rimraf.sync(targetPath);

  const patterns = getPatterns(srcPath);

  return new Promise((resolve) => {
    createStream(babelOptions, patterns).on('end', () => {
      if (watch) {
        log(
          chalk.magenta(
            `Start watching ${slash(srcPath).replace(
              `${cwd}/`,
              '',
            )} directory...`,
          ),
        );
        const watcher = chokidar.watch(patterns, {
          ignoreInitial: true,
        });

        const files = [];
        function compileFiles() {
          while (files.length) {
            createStream(babelOptions, files.pop());
          }
        }

        const debouncedCompileFiles = lodash.debounce(compileFiles, 1000);
        watcher.on('all', (event, fullPath) => {
          const relPath = fullPath.replace(srcPath, '');
          log(
            `[${event}] ${slash(join(srcPath, relPath)).replace(
              `${cwd}/`,
              '',
            )}`,
          );
          if (!existsSync(fullPath)) return;
          if (statSync(fullPath).isFile()) {
            if (!files.includes(fullPath)) files.push(fullPath);
            debouncedCompileFiles();
          }
        });
        process.once('SIGINT', () => {
          watcher.close();
        });
        dispose?.push(() => watcher.close());
      }
      resolve(true);
    });
  });
}

export default babelBuild;
