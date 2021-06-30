import { existsSync } from 'fs';
import { join } from 'path';

function getExistFile({ cwd, files, returnRelative }) {
  for (const file of files) {
    const absFilePath = join(cwd, file);
    if (existsSync(absFilePath)) {
      return returnRelative ? file : absFilePath;
    }
  }
}

export default getExistFile;
