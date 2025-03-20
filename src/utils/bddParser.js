// Helper: Given a global offset in the full text,
// return a Position object { line, character } (both 0-indexed).
function getLineColumn( text, offset ) {
	const substring = text.slice( 0, offset );
	const lines = substring.split( "\n" );
	const line = lines.length - 1;
	const character = lines[lines.length - 1].length;
	return { line, character };
}

/**
 * Main function: Parses the full text for test blocks.
 *
 * @param {string} text - The full source text.
 * @param {number} [startIndex=0] - Where in the text to start scanning.
 * @param {number} [stopIndex=text.length] - The absolute offset at which to stop scanning.
 * @returns {Array} An array of test block objects, each with:
 *   {
 *     name: string,         // e.g. "describe", "it", etc.
 *     title: string,        // extracted title from within the parentheses
 *     fullLine: string,     // the entire line containing the test call
 *     startOffset: number,  // absolute offset where the test call starts
 *     endOffset: number,    // absolute offset right after the block (or end of the call)
 *     range: {              // a Range object with Position objects
 *         start: { line: number, character: number },
 *         end: { line: number, character: number }
 *     },
 *     children: Array       // nested blocks
 *   }
 */
function parseTestBlocks( text, startIndex = 0, stopIndex = text.length ) {
	const blocks = [];
	// Todo: add support for commented out blocks. These will show up in the explorer.
	const regex = /\b(it|describe|given|when|then|feature|scenario|story)\s*\(/g;
	let index = startIndex;

	while ( index < stopIndex ) {
		regex.lastIndex = index;
		const match = regex.exec( text );
		if ( !match || match.index >= stopIndex ) {break;}

		const blockName = match[1];
		const globalStartOffset = match.index;
		const fullLine = extractLine( text, globalStartOffset );
		const title = extractTitleFromLine( text.substring( globalStartOffset ) );

		let absEndOffset;
		let children = [];

		// Look for the first '{' after the test call
		const openBracePos = text.indexOf( "{", globalStartOffset );
		if ( openBracePos === -1 || openBracePos >= stopIndex ) {
			// No block body found; end of call is the match end.
			absEndOffset = globalStartOffset + match[0].length;
		} else {
			// Find the matching closing brace.
			const { content, endPos: blockEndPos } = parseBlockContent( text, openBracePos );
			absEndOffset = blockEndPos;
			// Recursively parse nested test blocks from the block's content.
			// Use blockEndPos as the stopIndex so we don't scan past the current block.
			children = parseTestBlocks( text, openBracePos + 1, blockEndPos - 1 );
		}

		const range = {
			start : getLineColumn( text, globalStartOffset ),
			end   : getLineColumn( text, absEndOffset )
		};

		blocks.push( {
			name        : blockName,
			title,
			fullLine,
			startOffset : globalStartOffset,
			endOffset   : absEndOffset,
			range,
			children
		} );

		// Advance index to the end of the current block, so nested nodes
		// are only captured in `children` and not re-scanned at the top level.
		index = absEndOffset;
	}
	return blocks;
}

/**
 * Given the position of an opening '{', scan forward until the matching '}'
 * is found (taking nested braces into account).
 *
 * @param {string} text - The full source text.
 * @param {number} openBracePos - The index of the opening '{'.
 * @returns {{ content: string, endPos: number }} - The content inside the braces and the position immediately after the matching '}'.
 */
function parseBlockContent( text, openBracePos ) {
	let openCount = 1;
	let pos = openBracePos + 1;
	while ( pos < text.length && openCount > 0 ) {
		if ( text[pos] === "{" ) {
			openCount++;
		} else if ( text[pos] === "}" ) {
			openCount--;
		}
		pos++;
	}
	const content = text.substring( openBracePos + 1, pos - 1 );
	return { content, endPos: pos };
}

/**
 * Extract the entire line from `text` starting at `startOffset`
 * until the next newline (or the end of `text`).
 */
function extractLine( text, startOffset ) {
	const newlinePos = text.indexOf( "\n", startOffset );
	if ( newlinePos === -1 ) {
		return text.substring( startOffset );
	}
	return text.substring( startOffset, newlinePos );
}

/**
 * Extract a "title" from a test block call line.
 * It looks for patterns like:
 *   it("Some Title", ... or it(title="Some Title", ...)
 *
 * @param {string} line - The substring starting at the test call.
 * @returns {string} The extracted title (or an empty string if not found).
 */
function extractTitleFromLine( line ) {
	const match = line.match( /\(\s*(?:title\s*=\s*)?["']([^"']+)["']/ );
	return match ? match[1].trim() : "";
}

module.exports = { parseTestBlocks };
