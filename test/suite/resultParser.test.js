
const fs = require("fs");
const { findSuiteInResults } = require("../../src/utils/resultParser");

const resultJSON = fs.readFileSync("test/suite/results.json");
const treeJSON = fs.readFileSync("test/suite/tree.json");

const results = JSON.parse(resultJSON);

const assert = require('assert');
const vscode = require('vscode');


suite('TestBox Result Parser', () => {
  suiteTeardown(() => {
    vscode.window.showInformationMessage('All tests done!');
  });


  test('should find a suite in the results', () => {
    let suite = { label: "A Child Child Suite" };
    const suites = results.bundleStats.filter(bundle => bundle.totalSuites > 0);
    const foundSuite = findSuiteInResults(suite, suites);
    assert.ok(foundSuite, "Suite was not found");
  });
});