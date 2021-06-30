import { Dispose, IBundleOptions } from './index';
import { ModuleFormat } from 'rollup';

export interface BabelConfig {
  target: 'browser' | 'node';
  type?: ModuleFormat;
  typescript?: boolean;
  runtimeHelpers?: boolean;
  filePath?: string;
  browserFiles?: Record<string, any>;
  nodeVersion?: number;
  nodeFiles?: Record<string, any>;
  lazy?: boolean;
  lessInBabelMode?:
    | boolean
    | {
        paths?: any[];
        plugins?: any[];
      };
}

export interface BabelOptions {
  cwd: string;
  rootPath?: string;
  type: 'esm' | 'cjs';
  target?: 'browser' | 'node';
  log?: (string) => void;
  watch?: boolean;
  dispose?: Dispose[];
  importLibToEs?: boolean;
  bundleOpts: IBundleOptions;
}

export interface BabelTransformOptions {
  file: {
    contents: string;
    path: string;
  };
  type: 'esm' | 'cjs';
}
