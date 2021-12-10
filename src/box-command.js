/**
 * This class composes the commands to execute the testbox runners.
 */
const vscode = require( "vscode" );

module.exports = class BoxCommand {
	/**
     * Constructor
     *
     * @param {*} options The runnable options: { runBundle, runSpec, runHarness }
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

		// Run Bundle
		if ( this.runBundle ) {
			this.lastOutput = `${this.binary} testbox run directory='' bundles=${this.file}${this.bundleSuffix}`;
		}
		else if ( this.runSpec ){
			// TODO
		}
		// Run Harness
		else {
			this.lastOutput = `${this.binary} testbox run${this.harnessSuffix}`;
		}

		return this.lastOutput;
	}

	/**
     * Get the normalized file path to the doc
     */
	get file() {
		return this._normalizePath( vscode.window.activeTextEditor.document.fileName );
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
		if ( vscode.workspace.getConfiguration( "testbox" ).get( "boxBinary" ) ) {
			return vscode.workspace.getConfiguration( "testbox" ).get( "boxBinary" );
		}
		// Global registered box binary
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
