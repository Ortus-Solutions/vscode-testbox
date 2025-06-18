const { drawTable } = require( "../utils/table" );


// DISPLAY TERMINAL STUFF
const BOLD = "\x1b[1m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
// const YELLOW = "\x1b[33m";
// const MAGENTA = "\x1b[35m";
// const CYAN = "\x1b[36m";
const BLUE = "\x1b[34m";

const RESET = "\x1b[0m";
const prefix = {
	"Passed"  : `${GREEN}√ `,
	"Failed"  : `${RED}X `,
	"Errored" : `${RED}!! `,
	"Error"   : `${RED}!! `,
	"Skipped" : `${BLUE}- `,
};
const nl = "\r\n";
const tab = " ";


// We will need to do some kind of tree of this
function renderResult( results, run ) {
	run.appendOutput( nl );
	// run.appendOutput(`STARTING OUTPUT \r\n`);
	// This would output the "running tests please wait"
	const tableOut = drawTable(
		[
			"Passed",
			"Failed",
			"Errored",
			"Skipped",
			"Bundles",
			"Suites",
			"Specs"
		],
		[
			results.totalPass,
			results.totalFail,
			results.totalError,
			results.totalSkipped,
			results.totalBundles,
			results.totalSuites,
			results.totalSpecs,

		]
	);
	let tableColor = GREEN;
	if ( results.totalFail != 0 || results.totalError != 0 ) {
		tableColor = RED;
	}
	else if ( results.totalSkipped != 0 && results.totalPass == 0 ) {
		tableColor = BLUE;
	}

	run.appendOutput( BOLD + tableColor + tableOut + nl + RESET );

	results.bundleStats = results.bundleStats || [];
	for ( const bundle of results.bundleStats ) {
		renderBundle( bundle, run );
	}

	// const tabs = tab.repeat(2);

	let labels = ( results.labels || [] ).join( ", " );
	if ( labels.length == 0 ) {
		labels = "---";
	}

	run.appendOutput( `${BOLD}TestBox\t\t${results.version} ${nl}` );
	run.appendOutput( `${BOLD}CFML Engine\t${results.CFMLEngine} v ${results.CFMLEngineVersion}${nl}` );
	run.appendOutput( `${BOLD}Duration\t${results.totalDuration}ms${nl}` );
	run.appendOutput( `${BOLD}Labels\t\t${labels}${nl}` );
	run.appendOutput( nl );
	// CFML Engine     Lucee v5.4.6.9
	// Duration        21ms
	// Labels          ---

	run.appendOutput( `${prefix.Passed}Passed${RESET}  ${prefix.Skipped}Skipped${RESET}  ${prefix.Error}Exception/Error${RESET}  ${prefix.Failed}Failure${RESET}` );//
	run.appendOutput( nl );
	// run.appendOutput(`FINISHED OUTPUT \r\n`);
}

function renderBundle( bundle, run ) {
	run.appendOutput( `${RESET}` );

	const totalPass = bundle.totalPass || 0;
	const totalFail = bundle.totalFail || 0;
	const totalError = bundle.totalError || 0;
	const totalSkipped = bundle.totalSkipped || 0;
	const totalDuration = bundle.totalDuration || 0;
	let titlePrefix = prefix.Passed;

	if ( totalFail > 0 ) {
		titlePrefix = prefix.Failed;
	}
	else if ( totalError > 0 ) {
		titlePrefix = prefix.Failed;
	}

	if ( bundle.totalSuites == 0 && bundle.totalSpecs == 0 ) {
		// There is nothing to report here. We did not run any tests
		return;
	}
	run.appendOutput( `${BOLD}${titlePrefix}${bundle.name} (${totalDuration} ms)${nl}` );
	run.appendOutput( `[Passed: ${totalPass}] [Failed: ${totalFail}] [Errors: ${totalError}] [Skipped: ${totalSkipped}] [Suites/Specs: ${bundle.totalSuites}/${bundle.totalSpecs}]${nl}` );
	run.appendOutput( `${RESET}` );
	run.appendOutput( nl );
	bundle.suiteStats = bundle.suiteStats || [];

	for ( const suite of bundle.suiteStats ) {
		renderBundleOrSuiteResult( suite, run, 1 );
		run.appendOutput( nl + nl );

	}


}
function renderBundleOrSuiteResult( bunbdleOrSpec, run, tablevel = 0 ) {
	run.appendOutput( `${RESET}` );

	const titleprefix = prefix[bunbdleOrSpec.status || prefix.Passed];
	const totalDuration = bunbdleOrSpec.totalDuration || 0;
	const tabs = tab.repeat( tablevel );
	// const tabs = "";


	run.appendOutput( `${tabs}${titleprefix}${bunbdleOrSpec.name} ( ${totalDuration} ms)${nl}` );

	if ( bunbdleOrSpec.status == "Failed" ) {
		run.appendOutput( `${tabs}${tab}${RED}-> Failure: ${bunbdleOrSpec.failMessage}${nl}` );
	}

	bunbdleOrSpec.suiteStats = bunbdleOrSpec.suiteStats || [];
	for ( const suite of bunbdleOrSpec.suiteStats ) {
		renderBundleOrSuiteResult( suite, run, tablevel + 1 );
	}

	bunbdleOrSpec.specStats = bunbdleOrSpec.specStats || [];
	for ( const spec of bunbdleOrSpec.specStats ) {
		renderBundleOrSuiteResult( spec, run, tablevel + 1 );
	}

}

// TODO: move to the result Parser or a Decorator
function iconResults( resultJSON ) {
	let out = "";
	const icons = {
		"passed"  : "✅",
		"failed"  : "❌",
		"skipped" : "-",
		"error"   : "⚠️",
	};
	const totalPass = Math.max( 0, Number( resultJSON.totalPass ) || 0 );
	const totalFail = Math.max( 0, Number( resultJSON.totalFail ) || 0 );
	const totalSkipped = Math.max( 0, Number( resultJSON.totalSkipped ) || 0 );
	const totalError = Number( resultJSON.totalError );

	if ( totalPass <= 30 && totalPass > 0 ) {
		out += icons.passed.repeat( totalPass ) + " ";
	}
	else if ( totalPass > 0 ) {
		out += icons.passed + `(${totalPass}) `;
	}

	if ( totalFail <= 30 && totalFail > 0 ) {
		out += icons.failed.repeat( totalFail ) + " ";
	}
	else if ( totalFail > 0 ) {
		out += icons.failed + `(${totalFail}) `;
	}

	if ( totalError <= 30 && totalError > 0 ) {
		out += icons.error.repeat( totalError ) + " ";
	}
	else if ( totalError > 0 ) {
		out += icons.error + `(${totalError}) `;
	}
	else if ( totalError < 0 ) {
		// -1 seems to be a valid error code
		out += icons.error.repeat( 1 ) + " ";
	}


	if ( totalSkipped <= 30 ) {
		out += icons.skipped.repeat( totalSkipped ) + " ";
	}
	else if ( totalSkipped > 0 ) {
		out += icons.skipped + `(${totalSkipped}) `;
	}


	return out.trim();
}

module.exports = {
	renderResult,
	iconResults
};
