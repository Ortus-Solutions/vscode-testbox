
const vscode = require("vscode");
const { parseTestBlocks } = require('./utils/bddParser');
const { testResultHandler } = require("./utils/resultParser");
const { LOG } = require("./utils/logger");

const testFileGlob = '**/*{Spec,Test}.cfc';

/**
 * See https://code.visualstudio.com/api/extension-guides/testing
 */

// This is the associated data with each of the test items in the tree. Since we cant add extra data, a weakhashmap is used to store the data
let testData = new WeakMap();

class TestBoxTestItem {
    constructor(type, bundle, directory) {
        // Things we need to construct the URL and to classify the test
        this.type = type;
        this.bundle = bundle;
        this.directory = this.directory;
    }
}
/**
 * Creates and configures the CFML testing view controller.
 *
 * This function initializes a test controller for CFML tests using the vscode.tests API,
 * sets up a run profile that triggers test execution via the runTestsViaURL function,
 * and establishes a filesystem watcher to monitor test file changes. When test files are
 * created, changed, or deleted, the tests are rediscovered via the discoverTests function.
 *
 * @returns {Object} An object containing:
 *   - controller: The created test controller for managing CFML tests.
 *   - watcher: A filesystem watcher that monitors the test files and triggers test discovery on changes.
 */
function createTestingViewController() {
    const controller = vscode.tests.createTestController('cfmlTestController', 'CFML Tests');

    // Create a run profile that runs tests
    controller.createRunProfile('Run Tests', vscode.TestRunProfileKind.Run, (request, token) => {
        runTestsViaURL(request, token, controller);
    });
    const watcher = vscode.workspace.createFileSystemWatcher(testFileGlob);
    watcher.onDidCreate(() => discoverTests(controller));
    watcher.onDidChange(() => discoverTests(controller));
    watcher.onDidDelete(() => discoverTests(controller));

    // Populate the controller with on creation
    discoverTests(controller);

    return { controller, watcher };
}

/**
 * Discovers test files and adds them to the test controller.
 *
 * This function clears out any previous test items from the controller,
 * retrieves the list of test files based on the specified glob pattern
 * and excluded paths from the workspace configuration, and then maps
 * each file path to a test name before adding it to the controller.
 *
 * @param {vscode.TestController} controller - The test controller to which discovered tests will be added.
 * @returns {Promise<void>} A promise that resolves when the test discovery is complete.
 */
async function discoverTests(controller) {
    // Clear out previous items
    controller.items.replace([]);

    let runnerUrl = vscode.workspace.getConfiguration("testbox").get("runnerUrl");
    // console.log(runnerUrl);

    const excludedPaths = vscode.workspace.getConfiguration("testbox").get("excludedPaths");
    const files = await vscode.workspace.findFiles(testFileGlob, excludedPaths);
    for (const file of files) {
        const mappedPath = applyPathMappings(vscode.workspace.asRelativePath(file.fsPath));
        const bundleName = convertToDottedPackageName(mappedPath);
        const dirName = bundleName.split('.').slice(0, -1).join('.');
        const testUrl = `${runnerUrl}?reporter=JSON&recurse=false&directory=${dirName}&testBundles=${encodeURIComponent(bundleName)}`;
        // These are the root items. in theory all would be Specs?
        const testItem = controller.createTestItem(testUrl, bundleName, file);
        testItem.description = `Bundle`;
        testItem.tags = ["bundle"];

        const doc = await vscode.workspace.openTextDocument(file);
        testItem.range = new vscode.Range(0, 0, doc.lineCount - 1, 0);

        // Save it to our store. 
        testData.set(testItem, new TestBoxTestItem("bundle", bundleName, dirName));

        testItem.canResolveChildren = true;
        controller.resolveHandler = async (item) => {

            if (item !== null && item !== undefined && item.uri !== null && item.uri !== undefined) {
                const document = await vscode.workspace.openTextDocument(item.uri)
                const bddTree = parseTestBlocks(document.getText(), 0);

                for (const block of bddTree) {
                    addChildTests(controller, document, item, block, item, bundleName, dirName);
                }
            }
        }
        controller.items.add(testItem);
    }
}

/**
 * Recursively adds child tests to the given parent test item.
 *
 * @param {object} controller - The test controller used to create new test items.
 * @param {TextDocument} document - The document where tests are defined.
 * @param {TestItem} parent - The parent test item to which the child item will be added.
 * @param {object} child - The child test object containing details like name, title, range, and potential children.
 * @param {object} root - The root test item which generates a unique identifier for the child.
 * @param {string} bundleName - The name for the test suite/specification.
 * @param {string} dirName - The dot path directory name associated with the test.
 */
function addChildTests(controller, document, parent, child, root, bundleName, dirName) {
    // Test Suite and Test Spec
    const childtype = child.name === "it" ? "testSpecs" : "testSuites";
    const childTag = child.name === "it" ? "spec" : "suite";

    // We set the URL as the child id, it should be unique enough
    const childid = `${root.id}&${childtype}=${encodeURIComponent(child.title)}`;
    const childName = child.title;


    const subTest = controller.createTestItem(childid, childName, parent.uri);
    subTest.description = child.name === "it" ? "Spec" : "Suite";
    const range = child.range || { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } };
    subTest.range = new vscode.Range(range.start.line, range.start.character, range.end.line, range.end.character);
    subTest.tags = [childTag];

    testData.set(subTest, new TestBoxTestItem(childTag, bundleName, dirName));

    parent.children.add(subTest);
    if (child.children) {
        child.children.forEach(grandchild => {
            addChildTests(controller, document, subTest, grandchild, root, bundleName, dirName);
        });
    }
}


// Run raw, without box command abstraction
/**
 * Runs tests via a specified URL rather than using the BoxCommand abstraction as it willl be faster and the user doesnt need to 
 * install commandbox to run tests
 *
 * @param {vscode.TestRunRequest} request - The test run request.
 * @param {vscode.CancellationToken} token - The cancellation token.
 * @param {vscode.TestController} controller - The test controller.
 * @returns {Promise<void>} A promise that resolves when the tests have been run.
 */
async function runTestsViaURL(request, token, controller) {
    const run = controller.createTestRun(request);
    let runnerUrl = vscode.workspace.getConfiguration("testbox").get("runnerUrl", null);

    if (!runnerUrl) {
        vscode.window.showErrorMessage("No Testbox Runner URL configured in settings.");
        run.end();
        return;
    }

    // If we dont have an include, we are just running all the tests ??

    //Filter the tests so if we are asking to run a bundle, we only run the bundle, rather than all the tests in the bundle
    let requestedBundles = {};
    for (const test of request.include) {
        const testMeta = testData.get(test);
        if (testMeta.type === "bundle") {
            requestedBundles[testMeta.bundle] = true;
        }
    }

    let filteredTests = request.include.filter(test => {
        const testMeta = testData.get(test);

        // Is it a bundle
        if (testMeta.type === "bundle") {
            return true;
        }
        // If our bundle isnt listed, add ourselves
        if (!requestedBundles.hasOwnProperty(testMeta.bundle)) {
            return true;
        }

    });

    const testPromises = (filteredTests ?? []).map(async (test) => {

        if (token.isCancellationRequested) {
            return;
        }

        run.started(test);
        try {
            const response = await fetch(test.id);
            if (!response.ok) {
                vscode.workspace.showErrorMessage(`Can't reach RunnerURL [${test.id}]: HTTP error! Status: ${response.status}`);
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const json = await response.json();

            testResultHandler(test, json, run);

            run.appendOutput(`URL: ${test.id}\r\n`);
        } catch (error) {

            run.errored(test, error.message);
            if (error.cause.code == "ECONNREFUSED") {
                vscode.workspace.showErrorMessage(`Can't reach RunnerURL [${test.id}]. Connection refused.`);
            }
            LOG.error(error.stack);

            run.appendOutput(`Error running test ${test.label}: ${error.message}\r\n`);
            run.appendOutput(`URL:  ${test.id}\r\n`);
        }
    });

    await Promise.all(testPromises);
    run.end();
}

/**
 * Applies path mappings to a given relative file path.
 *
 * This function retrieves path mappings from the VSCode configuration for "testbox"
 * and replaces the start of the relative file path with the corresponding target path
 * if a matching source path is found.
 *
 * @param {string} relativeFilePath - The relative file path to apply mappings to.
 * @returns {string} - The new file path after applying the mappings, or the original
 *                     relative file path if no mappings match.
 */
function applyPathMappings(relativeFilePath) {
    const mappings = vscode.workspace.getConfiguration("testbox").get("pathMappings");
    for (const mapping of mappings) {
        if (relativeFilePath.startsWith(mapping.source)) {
            // This might not be correct, just have to replace the start
            const newPath = mapping.target + relativeFilePath.slice(mapping.source.length);
            return newPath;
        }
    }
    return relativeFilePath;
}





/**
 * Converts a given file path to a test name by removing the .cfc extension
 * and replacing both forward and backslashes with dots.
 *
 * @param {string} filePath - The file path to convert.
 * @returns {string} - The converted test name.
 */
function convertToDottedPackageName(filePath) {
    // Remove the .cfc extension (case-insensitive)
    const withoutExtension = filePath.replace(/\.cfc$/i, '');
    // Replace both forward and backslashes with dots
    const dottedPath = withoutExtension.replace(/[/\\]/g, '.');
    return dottedPath;
}

module.exports = {
    createTestingViewController
};