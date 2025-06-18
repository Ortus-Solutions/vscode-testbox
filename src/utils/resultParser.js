
const vscode = require( "vscode" );

function testResultHandler( test, results, run ) {
	// First update the current Node.
	updateTestWithResults( test, results, run );
	// Great! If we have children, we have to go through them and update them recursively.

	// Now let's output any errors or failures to the output window.

	const specs = [];
	findSpecsInResults( results, specs );
	for ( const spec of specs ) {
		updateSpecWithResults( spec, test, run );
	}

}
// Returns a position from the stack trace if we can.
function findPositionFromStack( test, stack ) {

	const testPath = test.uri.fsPath;
	// This needs path mapping from local -> server (or docker)
	for ( const trace of stack ) {
		if ( trace.template === testPath ) {
			return new vscode.Position( trace.line + 1, trace.column + 1 );
		}

	}
	// Get the position of the test if we cant get it from the stack trace.
	return new vscode.Position( test.range.start.line, test.range.start.character );
}

function updateSpecWithResults( specResult, test, run ) {

	// We might have a bunch of results inside the children so we need to check the result for each spec.
	if ( test.tags.includes( "spec" ) && test.label === specResult.name ) {
		// IF we have a spec, it is in error.
		// Todo. Figure out if the position is correct
		let position = new vscode.Position( test.range.start.line, test.range.start.character );
		let errorMessage = "";
		if ( specResult.totalError === -1 ) {
			run.failed( test, "Test Failed", specResult.totalDuration );
			return;
		}

		switch ( specResult.status ) {
		case "Passed":
			run.passed( test, specResult.totalDuration );
			break;
		case "Failed":
			// console.error(specResult);
			errorMessage = new vscode.TestMessage( specResult.failMessage );
			position = findPositionFromStack( test, specResult.failOrigin );
			run.appendOutput( `${specResult.failMessage}\r\n`, position, test );
			run.failed( test, errorMessage, specResult.totalDuration );
			break;
		case "Errored":
			errorMessage = new vscode.TestMessage( specResult.failMessage );
			position = findPositionFromStack( test, specResult.failOrigin );
			run.appendOutput( `${specResult.failMessage}\r\n`, position, test );
			run.errored( test, errorMessage, specResult.totalDuration );
			break;


		default:
			run.errored( test, "Test Errored", specResult.totalDuration );
			break;

		}

		if ( test.children.size > 0 ) {
			test.children.forEach( child => {
				updateSpecWithResults( specResult, child, run );
			} );
		}
	}
}

function findSpecsInResults( results, specs ) {

	if ( results.hasOwnProperty( "specStats" ) ) {
		for ( const spec of results.specStats ) {
			specs.push( spec );
		}
	}

	if ( results.hasOwnProperty( "suiteStats" ) ) {
		for ( const suite of results.suiteStats ) {
			findSpecsInResults( suite, specs );
		}
	}

	if ( results.hasOwnProperty( "bundleStats" ) ) {
		const bundleStats = results.bundleStats.filter( bundle => bundle.totalSuites > 0 );
		for ( const bundle of bundleStats ) {
			findSpecsInResults( bundle, specs );
		}
	}

}

function getAllSpecsFromTest( test ) {
	const specs = [];
	const tags = test.tags || [];
	// console.log("tags", tags);
	if ( tags.includes( "spec" ) ) {
		specs.push( test );
	}
	// const children = test.children.get();
	test.children.forEach( child => {
		// console.log("child", child);
		specs.push( ...getAllSpecsFromTest( child ) );
	} );

	return specs;
}

// This function updates the test with the results from the test run.
// IT recieves a spec and updates the the test with the results.
// It also updates the output window with the results. (Although this should be done in the test result handler)
function updateTestWithResults( test, resultSpec, run ) {
	const status = resultSpec.status || "";
	// const position = new vscode.Position(test.range.start.line, test.range.start.character); //??
	let message = new vscode.TestMessage( "Test Result" );
	switch ( status ) {
	case "Passed":
		run.passed( test, resultSpec.totalDuration );

		break;
	case "Failed":
		run.failed( test, new vscode.TestMessage( resultSpec.failMessage ), resultSpec.totalDuration );
		break;
	case "Errored":
		message = new vscode.TestMessage( "Test Errored" );
		if ( resultSpec.failMessage ) {
			message = new vscode.TestMessage( resultSpec.failMessage );
		}
		run.errored( test, message, resultSpec.totalDuration );
		break;
	case "Error":
		message = new vscode.TestMessage( "Test Errored" );
		if ( resultSpec.failMessage ) {
			message = new vscode.TestMessage( resultSpec.failMessage );
		}
		run.errored( test, message, resultSpec.totalDuration );
		break;
	case "Skipped":
		run.skipped( test, resultSpec.totalDuration );
		break;
	default:
		run.errored( test, new vscode.TestMessage( resultSpec.failMessage ), resultSpec.totalDuration );
		break;
	}

}

function findSuiteInResults( test, resultsArr ) {
	for ( const result of resultsArr ) {
		if ( result.name === test.label ) {
			return result;
		}
		if ( result.suiteStats ) {
			const found = findSuiteInResults( test, result.suiteStats );
			if ( found ) {
				return found;
			}
		}
	}
	return null;
}

/**
 * This parsers the full results and returns the object structure we need.
 * his will be a number of objects whhich we can then query.
 */
function parseTestResults( resultObject ) {

	return new TestResult( resultObject );
}
// Some of the objects to return
class TestResult {
	totalSuites = 0;
	startTime = 0;
	totalPass = 0;
	totalDuration = 0;
	totalSkipped = 0;
	totalFail = 0;
	totalSpecs = 0;
	resultID = "";
	endTime = 0;
	totalError = 0;
	totalBundles = 0;
	bundles = [];

	constructor( result ) {
		this.totalSuites = result.totalSuites || 0;
		this.startTime = result.startTime || 0;
		this.totalPass = result.totalPass || 0;
		this.totalDuration = result.totalDuration || 0;
		this.totalSkipped = result.totalSkipped || 0;
		this.totalFail = result.totalFail || 0;
		this.totalSpecs = result.totalSpecs || 0;
		this.resultID = result.resultID || "";
		this.endTime = result.endTime || 0;
		this.totalError = result.totalError || 0;
		this.totalBundles = result.totalBundles || 0;

		for ( const bundle of result.bundleStats ) {
			const bundleObj = new Bundle( bundle );
			bundleObj.parent = this;
			this.bundles.push( bundleObj );
		}
	}

	getSpecs() {
		const specs = [];
		for ( const bundle of this.bundles ) {
			specs.push( ...bundle.getSpecs() );
		}
		return specs;
	}

}

class Bundle {
	totalSuites = 0;
	startTime = 0;
	totalPass = 0;
	totalDuration = 0;
	totalSkipped = 0;
	totalFail = 0;
	totalSpecs = 0;
	path = "";
	endTime = 0;
	totalError = 0;
	name = "";
	id = "";
	suites = [];
	parent = null;
	// bundle = null;

	constructor( bundle ) {
		this.totalSuites = bundle.totalSuites || 0;
		this.startTime = bundle.startTime || 0;
		this.totalPass = bundle.totalPass || 0;
		this.totalDuration = bundle.totalDuration || 0;
		this.totalSkipped = bundle.totalSkipped || 0;
		this.totalFail = bundle.totalFail || 0;
		this.totalSpecs = bundle.totalSpecs || 0;
		this.path = bundle.path || "";
		this.endTime = bundle.endTime || 0;
		this.totalError = bundle.totalError || 0;
		this.name = bundle.name || "";
		this.id = bundle.id || "";

		for ( const suite of bundle.suiteStats ) {
			const suiteObj = new Suite( suite );
			suiteObj.parent = this;
			// suiteObj.bundle = bundle;
			this.suites.push( suiteObj );
		}

	}

	getSpecs() {
		const specs = [];
		for ( const suite of this.suites ) {
			specs.push( ...suite.getSpecs() );
		}
		return specs;
	}
}

class Suite {

	startTime = 0;
	totalPass = 0;
	totalDuration = 0;
	totalSkipped = 0;
	totalFail = 0;
	totalSpecs = 0;
	bundleID = 0;
	endTime = 0;
	totalError = 0;
	status = "";
	name = "";
	id = "";
	specs = [];
	suites = [];
	parent = null;

	constructor( suite ) {
		this.startTime = suite.startTime || 0;
		this.totalPass = suite.totalPass || 0;
		this.totalDuration = suite.totalDuration || 0;
		this.totalSkipped = suite.totalSkipped || 0;
		this.totalFail = suite.totalFail || 0;
		this.totalSpecs = suite.totalSpecs || 0;
		this.bundleID = suite.bundleID || 0;
		this.endTime = suite.endTime || 0;
		this.totalError = suite.totalError || 0;
		this.status = suite.status || "";
		this.name = suite.name || "";
		this.id = suite.id || "";

		for ( const spec of suite.specStats ) {
			const specObj = new Spec( spec );
			specObj.parent = this;
			specObj.bundle = suite.bundle;
			this.specs.push( specObj );
		}

		for ( const subsuite of suite.suiteStats ) {
			const suiteObj = new Suite( subsuite );
			suiteObj.parent = this;
			suiteObj.bundle = suite.bundle;
			this.suites.push( suiteObj );
		}

	}
	getSpecs() {
		const specs = [];
		for ( const spec of this.specs ) {
			specs.push( spec );
		}
		for ( const suite of this.suites ) {
			specs.push( ...suite.getSpecs() );
		}
		return specs;
	}
}

class Spec {
	error = {};
	startTime = 0;
	failExtendedInfo = "";
	totalDuration = 0;
	failStacktrace = "";
	failOrigin = {};
	status = "";
	suiteID = "";
	endTime = 0;
	name = "";
	id = "";
	failMessage = "";
	failDetail = "";

	parent = null;

	constructor( spec ) {
		this.error = spec.error || {};
		this.startTime = spec.startTime || 0;
		this.failExtendedInfo = spec.failExtendedInfo || "";
		this.totalDuration = spec.totalDuration || 0;
		this.failStacktrace = spec.failStacktrace || "";
		this.failOrigin = spec.failOrigin || {};
		this.status = spec.status || "";
		this.suiteID = spec.suiteID || "";
		this.endTime = spec.endTime || 0;
		this.name = spec.name || "";
		this.id = spec.id || "";
		this.failMessage = spec.failMessage || "";
		this.failDetail = spec.failDetail || "";

	}
}


// function matchResultsToTests(testTree, results, run) {
//     if (testTree.tags.includes("bundle")) {
//         const bundleResults = results.bundleStats.find(bundle => bundle.name === testTree.label);
//         if (bundleResults) {
//             testResultHandler(testTree, bundleResults, run);
//             testTree.children.forEach(child => matchResultsToTests(child, bundleResults, run));
//         }
//     } else if (testTree.tags.includes("suite")) {
//         const suiteResults = findSuiteInResults(testTree, results.bundleStats);
//         if (suiteResults) {
//             testResultHandler(testTree, suiteResults, run);
//             testTree.children.forEach(child => matchResultsToTests(child, suiteResults, run));
//         }
//     } else if (testTree.tags.includes("spec")) {
//         const specResults = findSuiteInResults(testTree, results.bundleStats);
//         if (specResults) {
//             testResultHandler(testTree, specResults, run);
//         }
//     }
// }

module.exports = {
	testResultHandler,
	findSuiteInResults,
	// matchResultsToTests,
	parseTestResults,
	getAllSpecsFromTest,
	updateTestWithResults
};