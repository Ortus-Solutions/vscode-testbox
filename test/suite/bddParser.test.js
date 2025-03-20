
const assert = require( "assert" );
const vscode = require( "vscode" );
const { parseTestBlocks } = require( "../../src/utils/bddParser.js" );
const fs = require( "fs" );
const path = require( "path" );

suite( "TestBox BDD Parser", () => {
	suiteTeardown( () => {
		vscode.window.showInformationMessage( "All tests done!" );
	} );

	test( "Parse blocks in a spec", () => {
		const filePath = path.join( __dirname, "../app/tests/specs/unit/CalculatorSpec.cfc" );
		const text = `
component extends="coldbox.system.testing.BaseModelTest" model = "models.Calculator"{

      function run() {

        describe("Calculator", function () {

          it("should be created", function () {
            expect(model).toBeComponent();
          });

          it("should add", function () {
            expect(model.add(1, 3)).toBe(4);
          });

          it("should fail", function () {
            expect(model.bad(4, 4)).toBe(4);
          });


        });

      }

    } `;
		// // getCurrentPath
		const blocks = parseTestBlocks( text, 0 );

		assert.ok( Array.isArray( blocks ), "Blocks should be an array" );
		assert.ok( blocks.length > 0, "We shold have found some items in the array" );
		assert.ok( blocks[0].name === "describe", "First block should be a describe block" );
		assert.equal( blocks[0].title, "Calculator" );
		assert.ok( blocks[0].startOffset === 120 );
		assert.ok( blocks[0].range.start.line === 5 );
		assert.ok( blocks[0].range.end.line === 20 );


	} );
} );
