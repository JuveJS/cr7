import { ModuleFormat } from 'rollup';
import { IBundleOptions, Dispose } from './index';

export interface RollupConfig {
  cwd: string;
  rootPath: string;
  entry: string;
  type: ModuleFormat;
  importLibToEs?: boolean;
  bundleOpts: IBundleOptions;
}

export interface RollupBuildOptions {
  cwd: string;
  rootPath?: string;
  entry: string | string[];
  type: ModuleFormat;
  log: (string) => void;
  bundleOpts: IBundleOptions;
  watch?: boolean;
  dispose?: Dispose[];
  importLibToEs?: boolean;
}
