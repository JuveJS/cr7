import { rollup, RollupWatcherEvent, watch } from 'rollup';
import signale from 'signale';
import getRollupConfig from './getRollupConfig';
import normalize from './normalize';
import { RollupBuildOptions } from '../../typings/rollup';

async function generate(entry: string, opts: RollupBuildOptions) {
  const { cwd, rootPath, type, log, bundleOpts, importLibToEs, dispose } = opts;
  const rollupConfigs = getRollupConfig({
    cwd,
    rootPath: rootPath || cwd,
    type,
    entry,
    importLibToEs,
    bundleOpts: normalize(entry, bundleOpts),
  });

  for (const rollupConfig of rollupConfigs) {
    if (opts.watch) {
      const watcher = watch([
        {
          ...rollupConfig,
          watch: {},
        },
      ]);
      watcher.on('event', (event: RollupWatcherEvent) => {
        if (event.code === 'ERROR') {
          signale.error(event.error);
        } else if (event.code === 'START') {
          log(`[${type}] Rebuild since file changed`);
        }
      });
      process.once('SIGINT', () => {
        watcher.close();
      });
      dispose?.push(() => watcher.close());
    } else {
      const { output, ...input } = rollupConfig;
      const bundle = await rollup(input);
      // @ts-ignore
      await bundle.write(output);
    }
  }
}

export default generate;
