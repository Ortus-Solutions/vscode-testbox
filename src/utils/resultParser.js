const vscode = require("vscode");

function testResultHandler(test, results, run) {


    // First update the current Node. 
    updateTestWithResults(test, results, run);
    // Great! If we have children, we have to go through them and update them recursively.

    // Now let's output any errors or failures to the output window.

    let specs = [];
    findSpecsInResults(results, specs);
    for (let spec of specs) {
        updateSpecWithResults(spec, test, run);
    }

}
// Returns a position from the stack trace if we can.
function findPositionFromStack(test, stack) {

    const testPath = test.uri.fsPath;
    // This needs path mapping from local -> server (or docker)
    for (let trace of stack) {
        if (trace.template === testPath) {
            return new vscode.Position(trace.line + 1, trace.column + 1);
        }

    }
    // Get the position of the test if we cant get it from the stack trace.
    return new vscode.Position(test.range.start.line, test.range.start.character);
}

function updateSpecWithResults(specResult, test, run) {

    if (test.tags.includes("spec") && test.label === specResult.name) {
        // IF we have a spec, it is in error. 
        // Todo. Figure out if the position is correct
        let position = new vscode.Position(test.range.start.line, test.range.start.character);
        let message = "";
        switch (specResult.status) {
            case "Passed":
                run.passed(test, specResult.totalDuration);
                break;
            case "Failed":
                // console.error(specResult);
                errorMessage = new vscode.TestMessage(specResult.failMessage);
                position = findPositionFromStack(test, specResult.failOrigin);
                run.appendOutput(`${specResult.failMessage}\r\n`, position, test);
                run.failed(test, errorMessage, specResult.totalDuration);
                break;
            case "Errored":
                errorMessage = new vscode.TestMessage(specResult.failMessage);
                position = findPositionFromStack(test, specResult.failOrigin);
                run.appendOutput(`${specResult.failMessage}\r\n`, position, test);
                run.errored(test, errorMessage, specResult.totalDuration);
                break;

            // skipped(test: TestItem): void;
            default:
        }
    }

    if (test.children.size > 0) {
        test.children.forEach(child => {
            updateSpecWithResults(specResult, child, run)
        });
    }
}


function findSpecsInResults(results, specs) {


    if (results.hasOwnProperty("specStats")) {
        for (let spec of results.specStats) {
            specs.push(spec);
        }
    }

    if (results.hasOwnProperty("suiteStats")) {
        for (let suite of results.suiteStats) {
            findSpecsInResults(suite, specs);
        }
    }


    if (results.hasOwnProperty("bundleStats")) {
        let bundleStats = results.bundleStats.filter(bundle => bundle.totalSuites > 0);
        for (let bundle of bundleStats) {
            findSpecsInResults(bundle, specs);
        }
    }



}


// This might be a bit overkill since we just really want the spec info
function updateTestWithResults(test, results, run) {
    if (results.totalError > 0) {
        run.errored(test, "Test Errored", results.totalDuration);
        const position = new vscode.Position(test.range.start.line, test.range.start.character);
        run.appendOutput(`Test Errored: ${test.label}\r\n`, position, test);
    } else if (results.totalFail > 0) {
        run.failed(test, "Test failed", results.totalDuration);
        const position = new vscode.Position(test.range.start.line, test.range.start.character);
        run.appendOutput(`Test failed: ${test.label}\r\n`, position, test);
    } else {
        run.passed(test, results.totalDuration);
        const position = new vscode.Position(test.range.start.line, test.range.start.character);
        run.appendOutput(`Test Passed: ${test.label}\r\n`, position, test);
    }
}

function findSuiteInResults(test, resultsArr) {
    for (const result of resultsArr) {
        if (result.name === test.label) {
            return result;
        }
        if (result.suiteStats) {
            const found = findSuiteInResults(test, result.suiteStats);
            if (found) {
                return found;
            }
        }
    }
    return null;
}



function matchResultsToTests(testTree, results, run) {
    if (testTree.tags.includes("bundle")) {
        const bundleResults = results.bundleStats.find(bundle => bundle.name === testTree.label);
        if (bundleResults) {
            testResultHandler(testTree, bundleResults, run);
            testTree.children.forEach(child => matchResultsToTests(child, bundleResults, run));
        }
    } else if (testTree.tags.includes("suite")) {
        const suiteResults = findSuiteInResults(testTree, results.bundleStats);
        if (suiteResults) {
            testResultHandler(testTree, suiteResults, run);
            testTree.children.forEach(child => matchResultsToTests(child, suiteResults, run));
        }
    } else if (testTree.tags.includes("spec")) {
        const specResults = findSuiteInResults(testTree, results.bundleStats);
        if (specResults) {
            testResultHandler(testTree, specResults, run);
        }
    }
}










// This function creates a new array with all the test resutts and the relevant tests, so we can then loop through it and update the tests with the results.
function createTestResultArray(test, results) {
    let tree = []
    let test_and_results = {
        test: test,
        results: results,
        type: "type"
    }
}

//  I go looking in the test results for the bundle, suite and spec stats. I then update the test with the results. I'm not sure if this is the best way to do it but it's a start. I'm not sure if I should be updating the test with the results or if I should be updating the test with the results and then
function findBundle(bundleName, test) {
    // console.log("comparing", bundleName, test.label);

    if (test.tags.includes("bundle") && test.label === bundleName) {
        return test;
    }
    return null;
}

// This will have to be recursive as I assume a suite can have suites
function findSuite(suiteName, test) {

    const tags = test.tags || [];
    if (tags.includes("suite") && suiteName === test.label) {
        return test;
    }

    if (test.children) {
        for (let child of test.children) {
            // console.log("suiteChild", child);
            // console.log("suiteChild test", child[1]);
            // For some reason it's a two part array in the children?
            const found = findSuite(suiteName, child[1]);
            if (found) {
                return found;
            }
        }
    }
    return null;
}
function findSpec(suiteName, test) {
    const tags = test.tags || [];
    // First encounter of a spec
    if (tags.includes("spec") && suiteName === test.label) {
        return test;
    }
    if (test.children) {
        for (let child of test.children) {

            const found = findSpec(suiteName, child[1]);
            if (found) {
                return found;
            }
        }
    }
    return null;
}

module.exports = {
    testResultHandler,
    findSuiteInResults,
    matchResultsToTests
}