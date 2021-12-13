/**
 * This class composes the commands to execute the testbox runners.
 */
const vscode = require( "vscode" );

module.exports = class BoxCommand {
	/**
     * Constructor
     *
     * @param {*} options The runnable options: { runBundle, runHarness }
     */
	constructor( options ) {
		this.runBundle = options !== undefined
			? options.runBundle
			: false;

		this.runHarness = options !== undefined
			? options.runHarness
			: false;

		this.runSpec = options !== undefined
			? options.runSpec
			: false;

		this.lastOutput = null;
	}

	/**
     * Returns the command to execute in the shell, basically our CommandBox execution or native execution
     *
     * box testbox run ....
     */
	get output() {
		// If we have output, return it, no need to run again
		if ( this.lastOutput ) {
			return this.lastOutput;
		}

		// console.log( `bundle:${this.runBundle}, harness:${this.runHarness}, spec: ${this.runSpec}` );

		// Run Bundle
		if ( this.runBundle ) {
			this.lastOutput = `${this.binary} testbox run${this.runnerUrl} recurse=false bundles=${this.file}${this.bundleSuffix}${this.bundleOptions}`;
		}
		// Run a spec: cursor must be within the spec to test.
		else if ( this.runSpec ){
			this.lastOutput = `${this.binary} testbox run${this.runnerUrl} directory='' recurse=false bundles=${this.file} testSpecs=${this.testSpecs}${this.bundleSuffix}${this.bundleOptions}`;
		}
		// Run Entire Test Harness
		else {
			this.lastOutput = `${this.binary} testbox run${this.runnerUrl}${this.harnessSuffix}${this.harnessOptions}`;
		}

		// console.log( `Command Output: ${this.lastOutput}` );

		return this.lastOutput;
	}

	/**
     * Get the runner URL from the configuration or let CommandBox discover it.
     */
	get runnerUrl(){
		let runnerUrl = vscode.workspace.getConfiguration( "testbox" ).get( "runnerUrl" );
		if ( runnerUrl ){
			return " runner=" + runnerUrl;
		}
		return "";
	}

	/**
     * Get the current spec nearest to the cursor to act as the testSpecs filter
     */
	get testSpecs(){
		// Get the line of code the cursor is in. This is cursor aware.
		let line = vscode.window.activeTextEditor.selection.active.line;
		let specName;

		while ( line > 0 ) {
			const lineText = vscode.window.activeTextEditor.document.lineAt( line ).text;
			const match = lineText.match( /\s*(?:describe|it|feature|story|scenario|given|when|then)\(\s(.*),/ );
			if ( match ) {
				// Group 1 contains the name of the spec with the quotes already single or double doesn't matter
				specName = match[ 1 ];
				break;
			}
			// go up the line to find it
			line--;
		}

		return specName;
	}

	/**
     * Build out all the runner options for running a test bundle
     */
	get bundleOptions(){
		let options = "";

		// Code Coverage
		if ( vscode.workspace.getConfiguration( "testbox" ).has( "testbox.codeCoverage" ) ){
			options += " codeCoverage=" + vscode.workspace.getConfiguration( "testbox" ).get( "testbox.codeCoverage" );
		}

		// Labels
		if ( vscode.workspace.getConfiguration( "testbox" ).has( "testbox.labels" ) ){
			options += " labels=" + vscode.workspace.getConfiguration( "testbox" ).get( "testbox.labels" );
		}
		if ( vscode.workspace.getConfiguration( "testbox" ).has( "testbox.excludes" ) ){
			options += " excludes=" + vscode.workspace.getConfiguration( "testbox" ).get( "testbox.excludes" );
		}

		return options;
	}

	/**
     * Build out all the runner options for running a full test harness.
     */
	get harnessOptions(){
		let options = "";

		// Code Coverage
		if ( vscode.workspace.getConfiguration( "testbox" ).has( "testbox.codeCoverage" ) ){
			options += " codeCoverage=" + vscode.workspace.getConfiguration( "testbox" ).get( "testbox.codeCoverage" );
		}

		// Labels
		if ( vscode.workspace.getConfiguration( "testbox" ).has( "testbox.labels" ) ){
			options += " labels=" + vscode.workspace.getConfiguration( "testbox" ).get( "testbox.labels" );
		}
		if ( vscode.workspace.getConfiguration( "testbox" ).has( "testbox.excludes" ) ){
			options += " excludes=" + vscode.workspace.getConfiguration( "testbox" ).get( "testbox.excludes" );
		}

		// Directory
		if ( vscode.workspace.getConfiguration( "testbox" ).has( "testbox.directory" ) ){
			options += " directory=" + vscode.workspace.getConfiguration( "testbox" ).get( "testbox.directory" );
		}

		// Bundles
		if ( vscode.workspace.getConfiguration( "testbox" ).has( "testbox.bundles" ) ){
			options += " bundles=" + vscode.workspace.getConfiguration( "testbox" ).get( "testbox.bundles" );
		}

		// Recurse
		if ( vscode.workspace.getConfiguration( "testbox" ).has( "testbox.recurse" ) ){
			options += " recurse=" + vscode.workspace.getConfiguration( "testbox" ).get( "testbox.recurse" );
		}

		return options;
	}

	/**
     * Get the normalized file path to the spec bundle to execute
     */
	get file() {
		return this._normalizePath( vscode.window.activeTextEditor.document.fileName )
		    // Cleanup up everything up to the specs folder
			.replace( /^(.*)(\/tests\/specs)/, "tests.specs" )
		    // remove / to . for dot notation
			.replace( /\//g, "." )
		    // Remove .cfc
			.replace( ".cfc", "" );
	}

	/**
     * Get the bundle suffix inline or from config
     */
	get bundleSuffix() {
		let suffix = vscode.workspace.getConfiguration( "testbox" ).get( "bundleSuffix" );
		if ( suffix ){
			return " " + suffix;
		}
		return "";
	}

	/**
     * Get the harness suffix inline or from config
     */
	get harnessSuffix() {
		let suffix = vscode.workspace.getConfiguration( "testbox" ).get( "harnessSuffix" );
		if ( suffix ){
			return " " + suffix;
		}
		return "";
	}

	/**
     * Get the CommandBox Binary location on disk
     * - Config
     * - Convention
     */
	get binary() {
		// Do we have a setting?
		if ( vscode.workspace.getConfiguration( "testbox" ).get( "boxBinary" ) ) {
			return vscode.workspace.getConfiguration( "testbox" ).get( "boxBinary" );
		}
		// Use the global commandbox namespace
		return "box";
	}

	get method() {
		let line = vscode.window.activeTextEditor.selection.active.line;
		let method;

		while ( line > 0 ) {
			const lineText = vscode.window.activeTextEditor.document.lineAt( line ).text;
			const match = lineText.match( /^\s*(?:public|private|protected)?\s*function\s*(\w+)\s*\(.*$/ );
			if ( match ) {
				method = match[1];
				break;
			}
			line = line - 1;
		}

		return method;
	}

	/**
     * Utility to normalize paths in different OS
     *
     * @param {*} path The path to normalize
     * @returns
     */
	_normalizePath( path ) {
		return path
			.replace( /\\/g, "/" ) // Convert backslashes from windows paths to forward slashes, otherwise the shell will ignore them.
			.replace( / /g, "\\ " ); // Escape spaces.
	}
};
