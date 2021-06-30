import AJV from 'ajv';
import { relative } from 'path';
import schema from './schema';
import getExistFile from './getExistFile';
import { IBundleOptions } from '../../typings';
import { slash } from './';

function testDefault(obj) {
  return obj.default || obj;
}

export const CONFIG_FILES = [
  '.cr7rc.js',
  '.cr7rc.jsx',
  '.cr7rc.ts',
  '.cr7rc.tsx',
];
const CLASSES = {
  Function: Function,
};
const extendAjv = (ajv: AJV.Ajv) => {
  ajv.addKeyword('instanceof', {
    compile: function (schema: string) {
      var Class = CLASSES[schema];
      return function (data: any) {
        return data instanceof Class;
      };
    },
  });
  return ajv;
};

function getUserConfig({ cwd }): IBundleOptions {
  const configFile = getExistFile({
    cwd,
    files: CONFIG_FILES,
    returnRelative: false,
  });

  if (configFile) {
    const userConfig = testDefault(require(configFile));
    const userConfigs = Array.isArray(userConfig) ? userConfig : [userConfig];
    userConfigs.forEach((userConfig) => {
      const ajv = extendAjv(new AJV({ allErrors: true }));
      const isValid = ajv.validate(schema, userConfig);
      if (!isValid) {
        const errors = ajv.errors.map(({ dataPath, message }, index) => {
          return `${index + 1}. ${dataPath}${dataPath ? ' ' : ''}${message}`;
        });
        throw new Error(
          `
Invalid options in ${slash(relative(cwd, configFile))}

${errors.join('\n')}
`.trim(),
        );
      }
    });
    return userConfig;
  } else {
    return {};
  }
}

export default getUserConfig;
