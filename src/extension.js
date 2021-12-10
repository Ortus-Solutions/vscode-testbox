// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require( "vscode" );
const BoxCommand = require( "./box-command" );

var globalCommand;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
module.exports.activate = function( context ) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log( "Congratulations, the \"TestBox\" Extension is now active!" );

	let disposables = [];

	// Display a message box to the user
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with `registerCommand`
	// The `commandId` parameter must match the command field in package.json
	disposables.push( vscode.commands.registerCommand( "testbox.jumpToSpec", () => jumpToSpec() ) );

	// Run Test Harness
	disposables.push( vscode.commands.registerCommand( "testbox.run-harness", async() => {
		await runCommand( new BoxCommand( { runHarness: true } ) );
	} ) );

	// Run a Test Bundle
	disposables.push( vscode.commands.registerCommand( "testbox.run-bundle", async() => {
		await runCommand( new BoxCommand( { runBundle: true } ) );
	} ) );

	// Run Previous
	disposables.push( vscode.commands.registerCommand( "testbox.run-previous", async() => {
		await runPreviousCommand();
	} ) );

	// Register the TestBox Runnable Task
	// https://code.visualstudio.com/api/extension-guides/task-provider
	disposables.push( vscode.tasks.registerTaskProvider( "testbox", {
		provideTasks : () => {
			return [
				new vscode.Task(
					// The task definition
					{ type: "testbox", task: "run" },
					// Workspace task, Global task = 1
					2,
					// The task name to register: used everywhere as testbox: run
					"run",
					// The task's source, in our case our registered name of 'testbox'
					"testbox",
					// Shell execution via the command output() method
					new vscode.ShellExecution( globalCommand.output ),
					// The problem matcher id => packaage.json
					"$testbox"
				)
			];
		}
	} ) );

	// Add all commands
	context.subscriptions.push( disposables );
};

// this method is called when your extension is deactivated
module.exports.deactivate = () => {
	// Not implemented
};

// This method is exposed for testing purposes.
module.exports.getGlobalCommandInstance = function() {
	return globalCommand;
};

/**
 * Store this object globally for the provideTasks, "run-previous", and for tests to assert against.
 *
 * @param {*} commandInstance
 */
function setGlobalCommandInstance( commandInstance ) {
	globalCommand = commandInstance;
}

/**
 * Set a specific passed command so it can be ran by the testbox: run task
 *
 * @param {*} command The command instance to run
 */
async function runCommand( command ) {
	// Verify we have an active editor or show error
	vscode.window.activeTextEditor
    || vscode.window.showErrorMessage( "TestBox: open a file to run this command" );

	// Store the latest command to execute and run it
	setGlobalCommandInstance( command );
	await vscode.commands.executeCommand( "workbench.action.terminal.clear" );
	await vscode.commands.executeCommand( "workbench.action.tasks.runTask", "testbox: run" );
}

/**
 * Run the previous command via the testbox: run task
 */
async function runPreviousCommand() {
	await vscode.commands.executeCommand( "workbench.action.terminal.clear" );
	await vscode.commands.executeCommand( "workbench.action.tasks.runTask", "testbox: run" );
}

/**
 * Jump to spec command implementation
 *
 * @returns void
 */
function jumpToSpec(){
	let editor = vscode.window.activeTextEditor;
	if ( !editor ) {
		return;
	}

	getTests( editor.document ).then( tests => {
		console.log( "Found tests:", tests );
		const aTestsMetadata = tests.map( test => {
			return {
				label  : test.lineText.text,
				detail : `Line number: ${test.lineText.lineNumber + 1}`
			};
		} );

		vscode.window.showQuickPick(
			aTestsMetadata,
			{ placeHolder: "Select a spec to jump" }
		).then( selection => {
			if (
				!selection ||
                    !selection.detail ||
                    !selection.detail.split( ": " )[1]
			) {
				console.log( "No valid selection made!" );
				return;
			}

			goToLine( Number( selection.detail.split( ": " )[ 1 ] ) );
		} );
	} );
}

/**
 * Move the editor to the specific line
 *
 * @param {*} line The line number to go to
 * @returns void
 */
function goToLine( line ) {
	const editor = vscode.window.activeTextEditor;
	if ( !editor ) {
		console.error( `Cannot go to line ${line} as editor is not active` );
		return;
	}
	let range = editor.document.lineAt( line - 1 ).range;
	editor.selection = new vscode.Selection( range.start, range.end );
	editor.revealRange( range );
}

/**
 * Get the promise of all the tests in the document
 *
 * @param {*} document The vscode document
 * @returns Promise due to parsing of the dom
 */
function getTests( document ) {
	// Return a promise, since this might take a while for large documents
	return new Promise( ( resolve, reject ) => {
		let testsToReturn = [];
		let lineCount = document.lineCount;

		for ( let lineNumber = 0; lineNumber < lineCount; lineNumber++ ) {
			let lineText = document.lineAt( lineNumber );
			// Does it match the testbox regex
			let tests = lineText.text.match(
				/(it\(|describe\(|given\(|when\(|then\(|feature\(|scenario\(|story\()/g
			);
			if ( tests ) {
				for ( let i = 0; i < tests.length; i++ ) {
					testsToReturn.push( { lineText: lineText } );
				}
			}
		}
		if ( testsToReturn.length > 0 ) {
			resolve( testsToReturn );
		} else {
			reject( "Found no tests" );
		}
	} ).catch();
}
