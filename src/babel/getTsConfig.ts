import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import * as ts from 'typescript';

function getTSConfig(cwd: string, rootPath: string) {
  const tsconfigPath = join(cwd, 'tsconfig.json');

  const templateTsconfigPath = join(__dirname, './tmpl/tsconfig.json');

  const readFile = (path: string) => readFileSync(path, 'utf-8');

  const path = existsSync(tsconfigPath)
    ? tsconfigPath
    : rootPath && existsSync(join(rootPath, 'tsconfig.json'))
    ? join(rootPath, 'tsconfig.json')
    : templateTsconfigPath;

  const result = ts.readConfigFile(path, readFile);

  return result.config && result.config.compilerOptions;
}

export default getTSConfig;
