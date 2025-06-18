const { describe, it, expect } = require( "@jest/globals" );
const { generateTreeFromText, TreeBundle } = require( "../../src/utils/testTreeGenerator" );
const path = require( "path" );
const fs = require( "fs" );

describe( "generateTreeFromText", () => {

	const relativePath = "test/app/tests/specs/unit/CalculatorTest.cfc";

	const absolutePath = path.resolve( relativePath );
	const packageName = "tests.specs.unit";
	const runnerURL = "http://localhost:8080/runnner.cfm";

	it( "should return a tree from a test", async() => {

		const content = fs.readFileSync( absolutePath, "utf-8" );
		const treeRoot = await generateTreeFromText( content, absolutePath, packageName, runnerURL );
		// console.log( { treeRoot } );

		expect( treeRoot ).toBeInstanceOf( TreeBundle );
		expect( treeRoot.packageName ).toBe( packageName );
		expect( treeRoot.path ).toBe( absolutePath );
		expect( treeRoot.children ).toBeInstanceOf( Array );
		expect( treeRoot.children.length ).toBeGreaterThan( 0 );
		expect( treeRoot.runnerUrl ).toBe( "http://localhost:8080/runnner.cfm" );

		const firstChild = treeRoot.children[0];
		const secondChild = treeRoot.children[1];
		// console.log({ firstChild });
		expect( firstChild ).toHaveProperty( "name" );
		expect( firstChild ).toHaveProperty( "children" );
		expect( firstChild.name ).toBe( "describe" );
		expect( firstChild.title ).toBe( "My First Suite" );
		expect( secondChild.title ).toBe( "My Second Suite" );

		// // Now check the children of the first test
		const firstGrandChild = firstChild.children[0];
		const secondGrandChild = firstChild.children[1];
		// console.log(firstGrandChild)
		// expect(firstGrandChild).toHaveProperty('name');


	} );
} );