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

		// Run Bundle
		if ( this.runBundle ) {
			this.lastOutput = `${this.binary} testbox run directory='' bundles=${this.file}${this.bundleSuffix}${this.bundleOptions}`;
		}
		// Run Entire Test Harness
		else {
			this.lastOutput = `${this.binary} testbox run${this.harnessSuffix}${this.harnessOptions}`;
		}

		return this.lastOutput;
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
