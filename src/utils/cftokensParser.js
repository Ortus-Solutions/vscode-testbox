
const { spawn } = require( "child_process" );
const { getCFTokensBinaryPath } = require( "./cftokensLoader" );


class TestNode {
	type;
	title;
	line;
	offset;
	endLine;
	endOffset;
	children = [];
	skipped = false;
	range = { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } };
	labels = [];
	constructor( type, title, line, offset, endLine, endOffset ) {
		this.type = type;
		this.title = title;
		this.line = line;
		this.offset = offset;
		this.endLine = endLine;
		this.endOffset = endOffset;

	}
}

/*
  This parses cftokens tokens output. Just for what we need,. but we can bve smarter by creating different block types,
  These could be defined by a start and end token as well as a block depth and a block stack?
  This might make it easier to parse the tokens and create a tree of blocks.
  SOme start end tokens are:

 */

/*
TODO:  should add a get tokens at position, and get tokens for line etc.
*/

// String of tokens. Should move to typescript to know wtf is going on
function getTokensReport( tokensString ) {

	const tokens = JSON.parse( tokensString );
	let line = 0;
	let col = 0;
	let position = 0;
	let punctuationDefinitionString = false;
	let punctuationSectionBlock = false;
	let punctuationSectionGroup = false;
	let punctuationSectionParameters = false;


	const report = { tokensByType: {}, };

	for ( const token in tokens ) {


		const [
			text,
			context
		] = tokens[token];
		if ( text.indexOf( "\n" ) > -1 ) {
			const newlineCount = ( text.match( /\n/g ) || [] ).length;
			line += newlineCount;
			col = 0;
			position++;
			continue;
		}
		position += text.length;
		col += text.length;

		if ( context.includes( "punctuation.definition.string.begin.cfml" ) ) {
			punctuationDefinitionString = true;
		}

		if ( context.includes( "punctuation.section.block.begin.cfml" ) ) {
			punctuationSectionBlock = true;
		}

		if ( context.includes( "punctuation.section.group.begin.cfml" ) ) {
			punctuationSectionGroup = true;
		}

		if ( context.includes( "punctuation.section.parameters.begin.cfml" ) ) {
			punctuationSectionParameters = true;
		}


		if ( punctuationDefinitionString ) {
			context.push( "punctuation.definition.string.cfml" );
		}
		if ( punctuationSectionBlock ) {
			context.push( "punctuation.section.block.cfml" );
		}
		if ( punctuationSectionGroup ) {
			context.push( "punctuation.section.group.cfml" );
		}
		if ( punctuationSectionParameters ) {
			context.push( "punctuation.section.parameters.cfml" );
		}

		for ( const ctx in context ) {
			const ctxtype = context[ctx];
			if ( !report.tokensByType[ctxtype] ) {
				report.tokensByType[ctxtype] = [];
			}
			report.tokensByType[ctxtype].push( {
				text     : text,
				line     : line,
				col      : col,
				position : position,
				context  : context
			} );
		}

		if ( context.includes( "punctuation.definition.string.end.cfml" ) ) {
			punctuationDefinitionString = false;
		}
		if ( context.includes( "punctuation.section.block.end.cfml" ) ) {
			punctuationSectionBlock = false;
		}
		if ( context.includes( "punctuation.section.group.end.cfml" ) ) {
			punctuationSectionGroup = false;
		}
		if ( context.includes( "punctuation.section.parameters.end.cfml" ) ) {
			punctuationSectionParameters = false;
		}






	}

	// for (const [text, context] of tokens) {
	//   // Count tokens by type
	//   if (!report.tokensByType[context]) {
	//     report.tokensByType[context] = 0;
	//   }
	//   report.tokensByType[context]++;

	//   // Count tokens by context
	//   if (!report.tokensByContext[text]) {
	//     report.tokensByContext[text] = 0;
	//   }
	//   report.tokensByContext[text]++;

	//   // Count tokens by line
	//   const line = text.split('\n').length - 1;
	//   if (!report.tokensByLine[line]) {
	//     report.tokensByLine[line] = 0;
	//   }
	//   report.tokensByLine[line]++;
	// }

	return report;
}

/**
 * Tokenizes a CFML test file and returns a parsed tree of test blocks.
 * @param {string} filePath - Absolute path to the CFML test file.
 * @returns {Promise<Object[]>} Tree of parsed test structures.
 */

const cftokensPath = getCFTokensBinaryPath();
function getTestsFromFile( filePath ) {
	return new Promise( ( resolve, reject ) => {
		const child = spawn( cftokensPath, [
			"tokenize",
			filePath
		] );

		let stdout = "";
		let stderr = "";

		child.stdout.on( "data", ( data ) => {
			stdout += data.toString();
		} );

		child.stderr.on( "data", ( data ) => {
			stderr += data.toString();
		} );

		child.on( "close", ( code ) => {
			if ( code !== 0 ) {
				return reject( new Error( `cftokens exited with code ${code}: ${stderr}` ) );
			}

			try {
				const tokens = JSON.parse( stdout );
				// parseBlocks(tokens);
				const parsed = parseTestTokens( tokens );
				resolve( parsed );
			} catch ( err ) {
				reject( new Error( `Failed to parse output as JSON: ${err.message}` ) );
			}
		} );

		child.on( "error", ( err ) => {
			reject( new Error( `Failed to execute cftokens: ${err.message}` ) );
		} );
	} );
}
function getTestsFromText( content ) {
	return new Promise( ( resolve, reject ) => {
		const child = spawn( cftokensPath, [
			"tokenize",
			"-"
		] );

		let stdout = "";
		let stderr = "";

		child.stdout.on( "data", ( data ) => {
			stdout += data.toString();
		} );

		child.stderr.on( "data", ( data ) => {
			stderr += data.toString();
		} );

		child.on( "close", ( code ) => {
			if ( code !== 0 ) {
				return reject( new Error( `cftokens exited with code ${code}: ${stderr}` ) );
			}

			try {
				const tokens = JSON.parse( stdout );
				// parseBlocks(tokens);
				const parsed = parseTestTokens( tokens );
				resolve( parsed );
			} catch ( err ) {
				reject( new Error( `Failed to parse output as JSON: ${err.message}` ) );
			}
		} );

		child.on( "error", ( err ) => {
			reject( new Error( `Failed to execute cftokens: ${err.message}` ) );
		} );

		// Pipe the content into stdin
		child.stdin.write( content );
		child.stdin.end();
	} );
}

const isComment = ctx => ctx.some( c => c.includes( "comment" ) );
const isBlockStart = ctx => ctx.includes( "punctuation.section.block.begin.cfml" );
const isBlockEnd = ctx => ctx.includes( "punctuation.section.block.end.cfml" );
const isFunctionName = ctx => ctx.some( c => c.includes( "entity.name.function.cfml" ) );

/**
 * Parses a list of tokens and constructs a hierarchical representation of test functions
 * and their associated metadata, such as type, title, line numbers, and range.
 *
 * @param {Array.<[string, string[]]>} tokens - An array of tokens, where each token is a tuple
 * consisting of the token text and its context (an array of strings representing the token's scope).
 *
 * @returns {Array.<Object>} An array of root nodes representing the parsed test functions. Each node
 * contains the following properties:
 *   - `type` {string}: The type of the test function (e.g., "describe", "it").
 *   - `title` {string}: The title of the test function, extracted from double-quoted strings.
 *   - `line` {number}: The starting line number of the test function.
 *   - `offset` {number}: The starting offset of the test function.
 *   - `endLine` {number|null}: The ending line number of the test function (null if not determined).
 *   - `endOffset` {number|null}: The ending offset of the test function (null if not determined).
 *   - `children` {Array.<Object>}: An array of child nodes representing nested test functions.
 *   - `range` {Object}: An object representing the start and end positions of the test function:
 *       - `start` {Object}: The starting position with `line` and `column`.
 *       - `end` {Object|null}: The ending position with `line` and `column` (null if not determined).
 */
function parseTestTokens( tokens ) {
	const functionKeywords = new Set( [
		"describe",
		"xdescribe",
		"it",
		"xit",
		"given",
		"xgiven",
		"when",
		"xwhen",
		"then",
		"xthen",
		"feature",
		"xfeature",
		"scenario",
		"xscenario",
		"story",
		"xstory"
	] );


	let line = 0;
	let charInLine = 0;
	let offset = 0;

	const root = [];
	const scopeStack = [];
	let blockDepth = 0;
	let i = 0;

	while ( i < tokens.length ) {
		const [
			text,
			context
		] = tokens[i];
		const tokenStartLine = line;
		const tokenStartColumn = charInLine;
		const tokenOffset = offset;


		// Track line/column/offset
		if ( text.indexOf( "\n" ) > -1 ) {
			const newlineCount = ( text.match( /\n/g ) || [] ).length;
			line += newlineCount;
			charInLine = 0;
			offset++;
			i++;
			continue;
		}

		offset += text.length;
		charInLine += text.length;

		if ( isComment( context ) ) {
			i++;
			continue;
		}

		if ( isBlockStart( context ) ) {
			blockDepth++;
			i++;
			continue;
		}

		if ( isBlockEnd( context ) ) {
			blockDepth--;

			while (
				scopeStack.length > 0 &&
        scopeStack[scopeStack.length - 1].blockDepth > blockDepth
			) {
				const scope = scopeStack.pop();
				scope.node.endLine = tokenStartLine;
				scope.node.endOffset = tokenOffset;
				scope.node.range.end = {
					line   : tokenStartLine,
					column : tokenStartColumn
				};
			}

			i++;
			continue;
		}
		let skipped = false;
		if ( functionKeywords.has( text ) ) {
			const fnType = text;
			const startLine = tokenStartLine;
			const startColumn = tokenStartColumn;
			const startOffset = tokenOffset;

			if ( text.startsWith( "x" ) ) {
				skipped = true;
			}
			// Look ahead to collect title
			const title = lookAheadForTitle( tokens, i ).trim();
			// const title = titleParts.join("").trim();
			// let j = i + 1;
			// let titleStarted = false;
			// let titleParts = [];

			// This is the oild function but seeing why J is needed
			// while (j < tokens.length) {
			//   const [t, c] = tokens[j];
			//   if (t === '\n') {
			//     line++;
			//     charInLine = 0;
			//     offset++;
			//     j++;
			//     continue;
			//   }

			//   if (isComment(c)) {
			//     j++;
			//     continue;
			//   }

			//   offset += t.length;
			//   charInLine += t.length;

			//   if (isDoubleQuotedString(c)) {
			//     if (t === '"' && !titleStarted) {
			//       titleStarted = true;
			//     } else if (t === '"' && titleStarted) {
			//       break;
			//     } else if (titleStarted) {
			//       titleParts.push(t);
			//     }
			//   } else if (titleStarted) {
			//     break;
			//   }

			//   j++;
			// }
			// const title = titleParts.join("").trim();



			const node = {
				type      : fnType,
				title,
				line      : startLine,
				offset    : startOffset,
				endLine   : null,
				endOffset : null,
				children  : [],
				skipped   : skipped,
				range     : {
					start : { line: startLine, column: startColumn },
					end   : null // will be filled in when block ends
				}
			};

			const parent = scopeStack.length > 0 ? scopeStack[scopeStack.length - 1].node : null;
			if ( parent ) {
				parent.children.push( node );
			} else {
				root.push( node );
			}

			// Assume all functions open blocks, track for end positions
			scopeStack.push( { node, blockDepth: blockDepth + 1 } );


		}

		if ( isFunctionName( context ) && text.toLowerCase().startsWith( "test" ) ) {

			const startLine = tokenStartLine;
			const startColumn = tokenStartColumn;
			const startOffset = tokenOffset;
			const title = text;

			// Look ahead to collect title


			const node = {
				type      : "it",
				title,
				line      : startLine,
				offset    : startOffset,
				endLine   : null,
				endOffset : null,
				children  : [],
				skipped   : skipped,
				range     : {
					start : { line: startLine, column: startColumn },
					end   : null // will be filled in when block ends
				}
			};
			root.push( node );
		}
		// Increment the index
		i++;

	}

	return root;
}


function lookAheadForTitle( tokens, startIndex, maxsearch = 100 ) {
	const title = "";
	let i = startIndex;
	// let inFunctionCallParams = true;
	let inString = false;
	const maxLength = Math.min( tokens.length, startIndex + maxsearch );
	for ( i = startIndex; i < maxLength; i++ ) {

		const [
			text,
			context
		] = tokens[i];
		// inFunctionCallParams = context.includes("meta.function-call.parameters.cfml");
		if ( context.includes( "punctuation.definition.string.begin.cfml" ) ) {
			inString = true;
		}
		if ( context.includes( "punctuation.definition.string.end.cfml" ) ) {
			inString = false;
		}

		if ( inString
      && !context.includes( "punctuation.definition.string.begin.cfml" )
      && !context.includes( "punctuation.definition.string.end.cfml" )
		) {
			return text;
			// console.log({text}, {context});

		}

		//   if (text === '\n') {
		//     break;
		//   }

		//   if (isDoubleQuotedString(context)) {
		//     title += text;
		//   } else {
		//     break;
		//   }
		// }
		// while (i < tokens.length) {
		//   const [text, context] = tokens[i];

		//   if (text === '\n') {
		//     break;
		//   }

		//   if (isDoubleQuotedString(context)) {
		//     title += text;
		//   } else {
		//     break;
		//   }

		//   i++;
	}

	return title.trim();
}

module.exports = { parseTestTokens, getTestsFromFile, getTestsFromText, lookAheadForTitle, getTokensReport };
