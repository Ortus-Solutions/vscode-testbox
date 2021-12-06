// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require( "vscode" );

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate( context ) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log( 'Congratulations, your extension "TestBox" is now active!' );

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand(
        "testbox.jumpToSpec",
        function() {
            let editor = vscode.window.activeTextEditor;
            if ( !editor ) {
                return;
            }

            getTests( editor.document ).then( tests => {
                console.log( "Found tests:", tests );
                const arr = tests.map( test => {
                    return {
                        label: test.lineText.text,
                        detail: `Line number: ${test.lineText.lineNumber + 1}`
                    };
                });

                vscode.window.showQuickPick(
                    arr,
                    { placeHolder : "Select a spec to jump" }
                    ).then( selection => {
                        if (
                            !selection ||
                            !selection.detail ||
                            !selection.detail.split(": ")[1]
                        ) {
                            console.log( "No valid selection made!" );
                            return;
                        }

                        const lineNumber = selection.detail.split( ": " )[ 1 ];
                        goToLine( Number( lineNumber ) );
                    });
            });
        }
    );

    context.subscriptions.push( disposable );
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
    // Nothing yet
}
exports.deactivate = deactivate;

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

function getTests( document ) {
    // Return a promise, since this might take a while for large documents
    return new Promise( ( resolve, reject ) => {
        let testsToReturn = [];
        let lineCount = document.lineCount;

        for ( let lineNumber = 0; lineNumber < lineCount; lineNumber++ ) {
            let lineText = document.lineAt( lineNumber );
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
    }).catch();
}
