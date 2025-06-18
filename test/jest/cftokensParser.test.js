const path = require( "path" );
const { getTestsFromFile, lookAheadForTitle, getTokensReport } = require( "../../src/utils/cftokensParser" );
const { describe, it, expect } = require( "@jest/globals" );
const fs = require( "fs" );
describe( "extractTests", () => {
	const relativePath = "test/app/tests/specs/unit/CalculatorTest.cfc";
	const absolutePath = path.resolve( relativePath );


	it( "should extract test blocks correctly", async() => {
		const tests = await getTestsFromFile( absolutePath );

		expect( tests.length ).toBe( 2 ); // Adjust this based on your expected number of test blocks
	} );

	it( "should extract the correct test type", async() => {
		const tests = await getTestsFromFile( absolutePath );
		expect( tests[0].type ).toBe( "describe" );
		expect( tests[1].type ).toBe( "describe" );

		expect( tests[0].title ).toBe( "My First Suite" );
		expect( tests[1].title ).toBe( "My Second Suite" );
		// expect(tests[1].type).toBe('it');
	} );


	it( "should extract the correct children", async() => {
		const tests = await getTestsFromFile( absolutePath );
		const children = tests[0].children;
		expect( children.length ).toBe( 2 ); // Adjust this based on your expected number of children
		expect( children[0].type ).toBe( "it" );
		expect( children[1].type ).toBe( "describe" );

	} );

	it( "should extract the correct start and end offsets", async() => {
		const tests = await getTestsFromFile( absolutePath );

		const firstTest = tests[0];
		expect( firstTest.line ).toBe( 23 ); // Need to find a way to get the line number for the test
		expect( firstTest.endLine ).toBe( 53 );

	} );



	it( "should extract the correct title", async() => {
		const tests = await getTestsFromFile( absolutePath );
		expect( tests[0].title ).toBe( "My First Suite" );
		expect( tests[1].title ).toBe( "My Second Suite" );
	} );

	// Improve this test, maybe find the line that has each test
	it( "should extract the correct line number", async() => {
		const tests = await getTestsFromFile( absolutePath );
		expect( tests[0].line ).not.toBe( 0 );
		expect( tests[1].line ).not.toBe( 0 );
	} );

	it( "should look ahead for the title via position", () => {
		const tokens = [
			[
				"describe",
				[
					"source.cfml.script",
					"meta.class.body.cfml",
					"meta.function.body.cfml",
					"meta.function-call.cfml",
					"variable.function.cfml"
				]
			],
			[
				"(",
				[
					"source.cfml.script",
					"meta.class.body.cfml",
					"meta.function.body.cfml",
					"meta.function-call.cfml",
					"meta.function-call.parameters.cfml",
					"punctuation.section.group.begin.cfml"
				]
			],
			[
				" ",
				[
					"source.cfml.script",
					"meta.class.body.cfml",
					"meta.function.body.cfml",
					"meta.function-call.cfml",
					"meta.function-call.parameters.cfml"
				]
			],
			[
				"'",
				[
					"source.cfml.script",
					"meta.class.body.cfml",
					"meta.function.body.cfml",
					"meta.function-call.cfml",
					"meta.function-call.parameters.cfml",
					"meta.string.quoted.single.cfml",
					"string.quoted.single.cfml",
					"punctuation.definition.string.begin.cfml"
				]
			],
			[
				"The encodingUtils component",
				[
					"source.cfml.script",
					"meta.class.body.cfml",
					"meta.function.body.cfml",
					"meta.function-call.cfml",
					"meta.function-call.parameters.cfml",
					"meta.string.quoted.single.cfml",
					"string.quoted.single.cfml"
				]
			],
			[
				"'",
				[
					"source.cfml.script",
					"meta.class.body.cfml",
					"meta.function.body.cfml",
					"meta.function-call.cfml",
					"meta.function-call.parameters.cfml",
					"meta.string.quoted.single.cfml",
					"string.quoted.single.cfml",
					"punctuation.definition.string.end.cfml"
				]
			],
			[
				",",
				[
					"source.cfml.script",
					"meta.class.body.cfml",
					"meta.function.body.cfml",
					"meta.function-call.cfml",
					"meta.function-call.parameters.cfml",
					"punctuation.separator.function-call.cfml"
				]
			],
			[
				" ",
				[
					"source.cfml.script",
					"meta.class.body.cfml",
					"meta.function.body.cfml",
					"meta.function-call.cfml",
					"meta.function-call.parameters.cfml"
				]
			],
			[
				"function",
				[
					"source.cfml.script",
					"meta.class.body.cfml",
					"meta.function.body.cfml",
					"meta.function-call.cfml",
					"meta.function-call.parameters.cfml",
					"meta.function.anonymous.cfml",
					"meta.function.declaration.cfml",
					"storage.type.function.cfml"
				]
			]
		];
		const title = lookAheadForTitle( tokens, 0 );
		expect( title ).toBe( "The encodingUtils component" );
		// expect(tests[0].endLine).toBe(10);
		// expect(tests[1].endLine).toBe(20);
	} );
	it( "should look ahead for the title via named param", () => {
		const tokens = [
			[
				"describe",
				[
					"source.cfml.script",
					"meta.class.body.cfml",
					"meta.function.body.cfml",
					"meta.function-call.cfml",
					"variable.function.cfml"
				]
			],
			[
				"(",
				[
					"source.cfml.script",
					"meta.class.body.cfml",
					"meta.function.body.cfml",
					"meta.function-call.cfml",
					"meta.function-call.parameters.cfml",
					"punctuation.section.group.begin.cfml"
				]
			],
			[
				" ",
				[
					"source.cfml.script",
					"meta.class.body.cfml",
					"meta.function.body.cfml",
					"meta.function-call.cfml",
					"meta.function-call.parameters.cfml"
				]
			],
			[
				"title",
				[
					"source.cfml.script",
					"meta.class.body.cfml",
					"meta.function.body.cfml",
					"meta.function-call.cfml",
					"meta.function-call.parameters.cfml",
					"entity.other.function-parameter.cfml"
				]
			],
			[
				"=",
				[
					"source.cfml.script",
					"meta.class.body.cfml",
					"meta.function.body.cfml",
					"meta.function-call.cfml",
					"meta.function-call.parameters.cfml",
					"keyword.operator.assignment.binary.cfml"
				]
			],
			[
				"'",
				[
					"source.cfml.script",
					"meta.class.body.cfml",
					"meta.function.body.cfml",
					"meta.function-call.cfml",
					"meta.function-call.parameters.cfml",
					"meta.string.quoted.single.cfml",
					"string.quoted.single.cfml",
					"punctuation.definition.string.begin.cfml"
				]
			],
			[
				"The encodingUtils component with named param",
				[
					"source.cfml.script",
					"meta.class.body.cfml",
					"meta.function.body.cfml",
					"meta.function-call.cfml",
					"meta.function-call.parameters.cfml",
					"meta.string.quoted.single.cfml",
					"string.quoted.single.cfml"
				]
			],
			[
				"'",
				[
					"source.cfml.script",
					"meta.class.body.cfml",
					"meta.function.body.cfml",
					"meta.function-call.cfml",
					"meta.function-call.parameters.cfml",
					"meta.string.quoted.single.cfml",
					"string.quoted.single.cfml",
					"punctuation.definition.string.end.cfml"
				]
			],
			[
				",",
				[
					"source.cfml.script",
					"meta.class.body.cfml",
					"meta.function.body.cfml",
					"meta.function-call.cfml",
					"meta.function-call.parameters.cfml",
					"punctuation.separator.function-call.cfml"
				]
			],
			[
				" ",
				[
					"source.cfml.script",
					"meta.class.body.cfml",
					"meta.function.body.cfml",
					"meta.function-call.cfml",
					"meta.function-call.parameters.cfml"
				]
			],
			[
				"body",
				[
					"source.cfml.script",
					"meta.class.body.cfml",
					"meta.function.body.cfml",
					"meta.function-call.cfml",
					"meta.function-call.parameters.cfml",
					"entity.other.function-parameter.cfml"
				]
			]
		];
		const title = lookAheadForTitle( tokens, 0 );
		expect( title ).toBe( "The encodingUtils component with named param" );
		// expect(tests[0].endLine).toBe(10);
		// expect(tests[1].endLine).toBe(20);
	} );


} );
describe( "MXUnit Compatibitlity", () => {
	const mxUnitRelativePath = "test/app/testbox/tests/specs/MXUnitCompatTest.cfc";
	const mxUnitAbsolutePath = path.resolve( mxUnitRelativePath );
	it( "should extract test blocks correctly", async() => {
		const tests = await getTestsFromFile( mxUnitAbsolutePath );

		expect( tests.length ).toBe( 35 ); // Adjust this based on your expected number of test blocks
		for ( let i = 0; i < tests.length; i++ ) {

			expect( tests[i].title.startsWith( "test" ) ).toBeTruthy();
		}
	} );
} );

describe( "Token Object Report", () => {
	const relativePath = "test/jest/resources/CalculatorTest_tokens.json";
	const absolutePath = path.resolve( relativePath );
	const tokens = fs.readFileSync( absolutePath, "utf-8" );
	it( "should extract all the blocks into a report", async() => {
		const report = await getTokensReport( tokens );

	} );

} );