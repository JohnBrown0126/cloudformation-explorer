import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
  label: 'unitTests',
  files: 'out/test/**/*.test.js',
  workspaceFolder: 'out/',
  mocha: {
    ui: 'tdd',
    timeout: 20000
  },
  version: '1.72.0'
});
