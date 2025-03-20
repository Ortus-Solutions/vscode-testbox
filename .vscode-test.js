const { defineConfig } = require('@vscode/test-cli');
module.exports = defineConfig(
    {
        label: 'unitTests',
        version: 'insiders',
        workspaceFolder: './test/app',
        files: './test/suite/**/*.test.js'
    }
);
