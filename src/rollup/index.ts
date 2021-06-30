import { RollupBuildOptions } from '../../typings/rollup';
import generate from './generate';

async function rollupBuild(opts: RollupBuildOptions) {
  // multiple entry
  if (Array.isArray(opts.entry)) {
    const { entry: entries } = opts;
    for (const entry of entries) {
      await generate(entry, opts);
    }
  } else {
    // single entry
    await generate(opts.entry, opts);
  }
}

export default rollupBuild;
