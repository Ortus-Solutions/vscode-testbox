
const vscode = require( "vscode" );
const path = require( "path" );

async function getCoverageResults() {
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	const coverageFolder = vscode.workspace.getConfiguration( "testbox" ).get( "coverageRelativePath", null );

	if ( !workspaceFolder ) {
		vscode.window.showErrorMessage( "No workspace folder found." );
		return;
	}
	if ( !coverageFolder ) {
		vscode.window.showErrorMessage( "No Testbox Coverage Folder configured in settings." );
		return;
	}

	// Make the path absolute:

	const coverageFolderPath = path.join( workspaceFolder.uri.fsPath, coverageFolder );
	// const luceeExectionReport = new LuceeExectionReport(coverageFolderPath);




	return {};
}

