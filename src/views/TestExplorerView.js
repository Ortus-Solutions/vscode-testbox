const vscode = require( "vscode" );
const { generateTreeFromText, TreeSuite, TreeSpec } = require( "../utils/testTreeGenerator" );
const { parseTestResults, getAllSpecsFromTest, updateTestWithResults } = require( "../utils/resultParser" );
const { renderResult } = require( "../utils/resultRenderer" );
const { minimatch } = require( "minimatch" );


const testFileGlob = "**/*{Spec,Test,Tests}.cfc"; // <-- should be configurable
// TODO: Enable this for Boxlang Files too. There should be a way to detect this rather than hardcoding it.
const languageId = "cfml"; // The language ID for CFML files
const cfcFileGlob = "**/*.cfc";
/**
 * See https://code.visualstudio.com/api/extension-guides/testing
 */

// Lookup Maps: Used to store extra data about the tests and map to files
const testData = new WeakMap();

// Metadata classes used in the test explorer view to store information about the tests
class TestBundle {
	name = "";
	path = "";
	directory = "";
	runnerUrl = "";
	children = [];

	constructor( path, name, runnerUrl, block ) {
		// Things we need to construct the URL and to classify the test
		this.name = name;
		this.path = path;
		this.directory = name.split( "." ).slice( 0, -1 ).join( "." );
		this.runnerUrl = runnerUrl;
		// this.block = block || [];

		for ( const blockitem of block ) {
			this.children.push(
				new TestSuite( blockitem, this, this )
			);
		}

	}

	getJSONReporterURL() {

		const bundleName = this.name;
		const dirName = this.directory;
		return `${this.runnerUrl}?reporter=JSON&recurse=false&directory=${dirName}&bundles=${encodeURIComponent( bundleName )}`;
	}

	getSimpleReporterURL() {
		const runnerUrl = vscode.workspace.getConfiguration( "testbox" ).get( "runnerUrl" );
		if ( !runnerUrl ) {
			vscode.window.showErrorMessage( "No Testbox Runner URL configured in settings." );
			return;

		}
		const bundleName = this.name;
		const dirName = this.directory;
		return `${runnerUrl}?reporter=simple&recurse=false&directory=${dirName}&testBundles=${encodeURIComponent( bundleName )}`;
	}

	async getText() {
		const doc = await vscode.workspace.openTextDocument( this.path );
		return doc.getText();
	}

	//     const testURLSimple = `${runnerUrl}?reporter=simple&recurse=false&directory=${dirName}&testBundles=${encodeURIComponent(bundleName)}`;
	//     // These are the root items. in theory all would be Specs?
	//     const testItem = controller.createTestItem(testUrl, bundleName, file);
	getTestLabelPath() {
		return this.name;
	}
}
class TestSuite {
	// id = "";
	name = "";
	title = "";
	fullLine = "";
	startOffset = "";
	endOffset = "";
	range = "";
	bundle = "";
	parent = "";
	skipped = false;
	children = [];

	constructor( block, bundle, parent ) {
		this.name = block.type;
		// this.fullLine = block.fullLine;
		this.title = block.title;
		this.startOffset = block.offset;
		this.endOffset = block.endOffset;
		this.range = block.range || { start: { line: block.line, column: 0 }, end: { line: block.endLine, column: 0 } };
		this.skipped = block.skipped || false;
		this.bundle = bundle;
		this.parent = parent;

		for ( const blockitem of block.children ) {
			if ( [
				"it",
				"xit"
			].includes( blockitem.name ) ) {
				this.children.push( new TestSpec( blockitem, bundle, this ) );
			}
			else {
				this.children.push( new TestSuite( blockitem, bundle, this ) );
			}

		}
	}


	getID() {
		return this.bundle.name + "suite" + this.title;
	}
	getJSONReporterURL() {

		// const bundleName = this.bundle.name;
		const dirName = this.bundle.directory;
		return `${this.bundle.runnerUrl}?reporter=JSON&recurse=false&directory=${dirName}&testSuite=${encodeURIComponent( this.title )}`;
	}
	getURI() {
		return this.bundle.path;
	}
	getTestLabelPath() {
		return this.bundle.getTestLabelPath() + ": " + this.title;
	}
}
class TestSpec {
	id = "";
	title = "";
	name = "";
	fullLine = "";
	startOffset = "";
	endOffset = "";
	range = "";
	children = "";
	parent = "";
	bundle = "";
	constructor( block, bundle, parent ) {
		this.name = block.name;
		this.fullLine = block.fullLine;
		this.title = block.title;
		this.startOffset = block.startOffset;
		this.endOffset = block.endOffset;
		this.range = block.range;
		this.skipped = block.skipped || false;
		this.children = block.children || [];
		this.parent = parent;
		this.bundle = bundle;
		this.id = `${this.bundle.id}&testSpecs=${encodeURIComponent( this.title )}`;
	}

	getID() {
		return this.parent.getID() + "spec" + this.title;
	}
	getJSONReporterURL() {

		const dirName = this.bundle.directory;
		return `${this.bundle.runnerUrl}?reporter=JSON&recurse=false&directory=${dirName}&testSpec=${encodeURIComponent( this.title )}`;
	}
	getURI() {
		return this.bundle.path;
	}
	getTestLabelPath() {
		return this.bundle.getTestLabelPath() + ":" + this.title + "\r\n\t" + this.getJSONReporterURL();
	}
}

// This creates the explorer view. A lot of the functions are added within as they need the controller which we keep in the createTestExplorerView scope


async function createTestExplorerView( context ) {

	context.subscriptions.push(
		vscode.commands.registerCommand( "testbox.open-in-browser", async( testItem ) => {
			if ( testItem ) {
				vscode.window.showInformationMessage( `Custom command triggered for: ${testItem.label}` );
				const testMetadata = testData.get( testItem );
				await vscode.env.openExternal( testMetadata.getSimpleReporterURL() );
			}
		} )
	);


	const controller = vscode.tests.createTestController( "cfmlTestController", "CFML Tests" );
	let excludedPackagesConfig = vscode.workspace.getConfiguration( "testbox" ).get( "excludedPackages", "" ) || "";
	let excludedPackagesArray = excludedPackagesConfig.split( "," ).map( pkg => pkg.trim().toLowerCase() ).filter( pkg => pkg !== "" );
	let testboxRunnerURL = await getTestBoxRunnerUrl();

	controller.resolveHandler = async test => {
		// So we could do some kind of lazy loading here.
		if ( !test ) {
			// await discoverAllFilesInWorkspace();
			// Add performance markers
			console.time( "discoverAllFilesInWorkspace" );
			await discoverAllFilesInWorkspace();
			console.timeEnd( "discoverAllFilesInWorkspace" );

			// For the selection area:
		} else {
			console.time( `parseTestsInFileContents-${test.id}` );
			await parseTestsInFileContents( test );
			console.timeEnd( `parseTestsInFileContents-${test.id}` );
		}
	};




	// Throttle document change events to avoid excessive parsing
	let parseTimeout;
	const throttledParseDocument = ( document ) => {
		clearTimeout( parseTimeout );
		parseTimeout = setTimeout( () => parseTestsInDocument( document ), 300 );
	};

	vscode.workspace.onDidChangeTextDocument( async e => await throttledParseDocument( e.document ) );

	vscode.workspace.onDidChangeConfiguration( async( e ) => {
		if ( e.affectsConfiguration( "testbox" ) ) {
			testboxRunnerURL = await getTestBoxRunnerUrl();
			excludedPackagesConfig = vscode.workspace.getConfiguration( "testbox" ).get( "excludedPackages", "" ) || "";
			excludedPackagesArray = excludedPackagesConfig.split( "," ).map( pkg => pkg.trim().toLowerCase() ).filter( pkg => pkg !== "" );
			discoverAllFilesInWorkspace();
		}
	} );

	//  WATCH FILES FOR CHANGEES
	const watcher = vscode.workspace.createFileSystemWatcher( testFileGlob, false, false, false );
	// When a file is created,add it to the tree.
	watcher.onDidCreate( uri => getOrCreateFile( uri ) );
	// When we change it, re-parse the file contents
	watcher.onDidChange( async uri => {
		const testTreeItem = await getOrCreateFile( uri );
		parseTestsInFileContents( testTreeItem );
	} );
	// When we delete it, remove it from the tree
	watcher.onDidDelete( uri => controller.items.delete( uri.toString() ) );

	async function getOrCreateFile( uri ) {
		const existing = controller.items.get( uri.toString() );
		if ( existing ) {
			return existing;
		}


		// Is this file even a test file
		const isTestFile = minimatch( uri.fsPath, testFileGlob, { debug: false, nocase: true } );
		if ( !isTestFile ) {
			// console.log(`Skipping file ${uri.fsPath} as it does not match the test file glob.`);
			return; // Skip this file
		}
		const relativePath = vscode.workspace.asRelativePath( uri );
		const mappedPath = applyPathMappings( relativePath );
		const packageName = convertToDottedPackageName( mappedPath );

		// Should be done in a separate function
		for ( const excludedPackage of excludedPackagesArray ) {
			// Set to lowercase to make sure we are not case senssitive
			if ( packageName.toLowerCase().startsWith( excludedPackage ) ) {
				return;
			}
		}

		const testItem = controller.createTestItem( packageName, packageName, uri );
		testItem.description = `Bundle`;
		// testItem.tags = ["bundle"];
		testItem.canResolveChildren = true;

		const testBundle = new TestBundle( mappedPath, packageName, testboxRunnerURL, [] );
		testData.set( testItem, testBundle );
		controller.items.add( testItem );
		return testItem;

	}

	async function parseTestsInDocument( document ) {
		if ( document.uri.scheme === "file" && document.languageId === languageId ) {
			parseTestsInFileContents( await getOrCreateFile( document.uri ), document.getText() );
		}
	}

	// file: vscode.TestItem, contents?: string
	async function parseTestsInFileContents( testItem, contents ) {
		// If document is already open, if we are in a resolve handler it might not be open yet and we need to read it from disk
		if ( contents === undefined && testItem.uri.scheme === "file" ) {
			const rawContent = await vscode.workspace.fs.readFile( testItem.uri );
			contents = new TextDecoder().decode( rawContent );
		}
		const runnerUrl = await getTestBoxRunnerUrl();
		const tree = await generateTreeFromText( contents, testItem.uri, testItem.id, runnerUrl );
		createTestTree( tree, testItem, controller );
		testData.set( testItem, tree );
	}

	async function discoverAllFilesInWorkspace() {
		if ( !vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0 ) {
			// if there are no workspace folders, we cannot discover any files
			return [];
		}
		const excludedPathsConfig = vscode.workspace.getConfiguration( "testbox" ).get( "excludedPaths", "" ) || "";
		const maxFilesInWorkspace = vscode.workspace.getConfiguration( "testbox" ).get( "maxFilesInWorkspace", 5000 );

		controller.items.replace( [] ); // Clear out the previous items
		return Promise.all(
			vscode.workspace.workspaceFolders.map( async( workspaceFolder ) => {
				const allFiles = await vscode.workspace.findFiles( cfcFileGlob, excludedPathsConfig, maxFilesInWorkspace );
				for ( const file of allFiles ) {
					getOrCreateFile( file );
				}

			} ) // end  vscode.workspace.workspaceFolders.map(async (folder)
		);
	}

	// Run the Tests
	controller.createRunProfile(
		"Run",
		vscode.TestRunProfileKind.Run,
		( request, token ) => {
			return runHandler( false, false, request, token );
		},
	);


	/**
	 * Handles the execution of test runs with support for batching, coverage, and debugging.
	 *
	 * @async
	 * @function runHandler
	 * @param {boolean} [shouldCoverage=false] - Whether to collect code coverage during test execution
	 * @param {boolean} [shouldDebug=false] - Whether to run tests in debug mode
	 * @param {Object} request - The test run request object containing include/exclude filters
	 * @param {Object} token - Cancellation token to check if the operation should be cancelled
	 * @returns {Promise<void>} Promise that resolves when all test batches have completed
	 * @description
	 * Creates a test run, organizes tests into batches based on available runner threads,
	 * and executes them in parallel while respecting cancellation requests. Automatically
	 * parses test file contents for bundles that don't have pre-parsed children.
	 */
	async function runHandler( shouldCoverage = false, shouldDebug = false, request, token ) {
		const run = controller.createTestRun( request );
		const queue = [];
		const batchSize = getTotalRunnerThreads();

		// Collect all tests to run
		if ( request.include ) {
			request.include.forEach( test => queue.push( test ) );
		} else {
			controller.items.forEach( test => queue.push( test ) );
		}

		const dedupeQueue = filterSelection( queue );

		// Create batches of tests
		const batches = [];
		for ( let i = 0; i < dedupeQueue.length; i += batchSize ) {
			batches.push( dedupeQueue.slice( i, i + batchSize ) );
		}

		// Run each batch in parallel
		for ( const batch of batches ) {
			if ( token.isCancellationRequested ) { break; }
			// console.log( `Running batch of ${batch.length} tests...` );
			const batchPromises = batch.map( async test => {
				if ( token.isCancellationRequested ) { return; }
				if ( request.exclude?.includes( test ) ) { return; }

				// If we don't know the children in a bundle, parse them now.
				if ( test.children.size === 0 ) {
					await parseTestsInFileContents( test );
				}

				return runIndividualTest( test, request, run, token, shouldCoverage, shouldDebug );
			} );

			await Promise.all( batchPromises );
		}

		run.end();
	}


	// helperfunctions
	function hasSelectedAncestor( item, selectedSet ) {
		let current = item.parent;
		while ( current ) {
			if ( selectedSet.has( current.id ) ) {
				return true;
			}
			current = current.parent;
		}
		return false;
	}

	function filterSelection( selectedItems ) {
		const selectedSet = new Set( selectedItems.map( item => item.id ) );

		return selectedItems.filter( item => !hasSelectedAncestor( item, selectedSet ) );
	}


	async function runIndividualTest( test, request, run, cancellation, isDebug = false, isCoverage = false ) {
		const start = Date.now();
		run.started( test );
		const testMeta = testData.get( test );
		const urlToRun = testMeta.getJSONReporterURL();
		// Not implemented
		if ( isCoverage ) {  // urlToRun = urlToRun + "&=coverage=true";
		}
		if ( isDebug ) { // Have to somehow start luceedebuig?
		}

		if ( cancellation.isCancellationRequested ) {
			run.appendOutput( `\t🚨  Test cancelled [${test.id}]\r\n` );
			run.errored( test, `Test cancelled [${test.id}]` );
			return;
		}

		try {
			run.appendOutput( `🧪 ${test.label} [${urlToRun}]\r\n` );
			const response = await fetch( urlToRun );
			if ( !response.ok ) {
				const message = `\t🚨 HTTP error ${response.status} [${urlToRun}]\r\n`;
				run.errored( test, message, Date.now() - start );
				vscode.window.showErrorMessage( message );
				run.appendOutput( message );
				// Nothing else to do for this test
				return;
			}


			const results = await response.json();
			const testResults = parseTestResults( results );
			const specResults = testResults.getSpecs(); // Gets all the specs that were run
			// Option 3: Use reduce to build object with custom key
			const specResultLookup = specResults.reduce( ( acc, spec ) => {
				acc[`${spec.name}___${spec.parent.name}`] = spec;
				return acc;
			}, {} );
			const testSpecs = getAllSpecsFromTest( test ); // Gets all  tests in the tree

			if ( testResults.totalSkipped == testResults.totalSpecs ) {
				run.skipped( test, `All tests skipped [${test.id}]` );
			}


			for ( const testItem of testSpecs ) {
				const ref = `${testItem.label}___${testItem.parent.label}`;
				const result = specResultLookup[ref];
				if ( result ) {
					updateTestWithResults( testItem, result, run );
				}
				// Go through all of these to look for our results.
			}

			renderResult( results, run );

			// Coverage stuff for the future
			// const statement = new vscode.StatementCoverage(true, new vscode.Range(0, 50, 10, 1));
			// const fileCoverage = new vscode.FileCoverage(test.uri, [statement]);
			// new vscode.CoverageResult(test.label, test.uri, [fileCoverage], Date.now() - start);
			// run.addCoverage(fileCoverage)
		}
		catch ( error ) {
			// run.appendOutput(`🧪: ${test.label}\r\n`);
			const message = `\t🚨  Error [${error.message}] [${urlToRun}]:\r\n`;
			run.errored( test, message );
			vscode.window.showErrorMessage( message );
			run.appendOutput( message );
			// LOG.error(error.stack);
		}

	}

	return { controller };
}

/**
 * Retrieves the TestBox runner URL from either the box.json configuration file or VS Code settings.
 *
 * First attempts to locate a box.json file in the workspace root and extract the runner URL
 * from the testbox.runner property. If no box.json file is found or the runner property
 * is not specified, falls back to the "runnerUrl" setting from the VS Code "testbox" configuration.
 *
 * @async
 * @function getTestBoxRunnerUrl
 * @returns {Promise<string|undefined>} The TestBox runner URL, or undefined if not configured
 * @throws {Error} May throw if box.json file cannot be read or parsed as valid JSON
 */
async function getTestBoxRunnerUrl() {
	// Look for the box file in the root.
	const boxFiles = await vscode.workspace.findFiles( "box.json", "", 1 );
	if ( boxFiles && boxFiles.length ) {
		// Dont have to actually open the file to emit it
		const boxFileDoc = await vscode.workspace.fs.readFile( boxFiles[0] );
		const boxFileJSON = JSON.parse( boxFileDoc );
		if ( boxFileJSON.testbox && boxFileJSON.testbox.runner ) {
			return boxFileJSON.testbox?.runner;
		}
	}
	// If we dont have it check in the settings
	return vscode.workspace.getConfiguration( "testbox" ).get( "runnerUrl" );

}

/**
 * Recursively creates a test tree structure for the Testbox Test Explorer view.
 * Processes TreeSuite and TreeSpec items from the given tree item's children,
 * creating corresponding test items in the controller and adding them under a bundle or suite
 *
 * @param {Object} treeitem - The parent tree item containing children to process
 * @param {Object} viewRoot - The root view item where new test items will be added
 * @param {Object} controller - The test controller used to create new test items
 * @returns {void}
 */
function createTestTree( treeitem, viewRoot, controller ) {

	// Get all the children of the tree
	if ( !treeitem.children ) {
		return;
	}
	for ( const item of treeitem.children ) {
		if ( item instanceof TreeSuite ) {
			const subTest = controller.createTestItem( item.id, item.title, viewRoot.uri );
			subTest.description = "Suite";
			const range = item.range || { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } };
			subTest.range = new vscode.Range( range.start.line, range.start.column, range.end.line, range.end.column );
			subTest.tags = [ "suite" ];
			viewRoot.children.add( subTest );
			testData.set( subTest, item );
			createTestTree( item, subTest, controller );
		}
		if ( item instanceof TreeSpec ) {
			const subTest = controller.createTestItem( item.id, item.title, viewRoot.uri );
			subTest.description = "Spec";
			const range = item.range || { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } };
			subTest.range = new vscode.Range( range.start.line, range.start.column, range.end.line, range.end.column );
			subTest.tags = [ "spec" ];
			viewRoot.children.add( subTest );
			testData.set( subTest, item );
		}
	}

}


/**
 * Gets the total number of runner threads from the VSCode workspace configuration.
 * Retrieves the 'urlThreads' setting from the 'testbox' configuration, with validation
 * to ensure a minimum of 1 thread and a default of 10 threads if not configured or set to 0.
 *
 * @returns {number} The number of runner threads to use (minimum 1, default 10)
 */
function getTotalRunnerThreads() {
	let threads = vscode.workspace.getConfiguration( "testbox" ).get( "urlThreads", 10 );
	if ( !threads || threads === 0 ) {
		threads = 10;
	}
	if ( threads < 1 ) {
		threads = 1;
	}
	return threads;
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
function applyPathMappings( relativeFilePath ) {
	const mappings = vscode.workspace.getConfiguration( "testbox" ).get( "pathMappings" );
	for ( const mapping of mappings ) {
		if ( relativeFilePath.startsWith( mapping.source ) ) {
			// This might not be correct, just have to replace the start
			const newPath = mapping.target + relativeFilePath.slice( mapping.source.length );
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
function convertToDottedPackageName( filePath ) {
	// Remove the .cfc extension (case-insensitive)
	const withoutExtension = filePath.replace( /\.cfc$/i, "" );
	// Replace both forward and backslashes with dots
	const dottedPath = withoutExtension.replace( /[/\\]/g, "." );
	return dottedPath;
}

module.exports = {
	createTestExplorerView,
	TestBundle,
	TestSuite,
	TestSpec
};