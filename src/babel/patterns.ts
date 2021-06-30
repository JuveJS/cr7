import { join } from 'path';

export const getPatterns = (path: string) => [
  join(path, '**/*'),
  `!${join(path, '**/fixtures{,/**}')}`,
  `!${join(path, '**/demos{,/**}')}`,
  `!${join(path, '**/__test__{,/**}')}`,
  `!${join(path, '**/__tests__{,/**}')}`,
  `!${join(path, '**/*.mdx')}`,
  `!${join(path, '**/*.md')}`,
  `!${join(path, '**/*.+(test|e2e|spec).+(js|jsx|ts|tsx)')}`,
];
