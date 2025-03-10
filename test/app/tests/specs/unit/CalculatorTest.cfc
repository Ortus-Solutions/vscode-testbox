/**
 * My BDD Test
 */
component extends="testbox.system.BaseSpec" {

	/*********************************** LIFE CYCLE Methods ***********************************/

	/**
	 * executes before all suites+specs in the run() method
	 */
	function beforeAll() {
	}

	/**
	 * executes after all suites+specs in the run() method
	 */
	function afterAll() {
	}

	/*********************************** BDD SUITES ***********************************/

	function run( testResults, testBox ) {
		// all your suites go here.
		describe( "My First Suite", function() {
			it( "A Spec", function() {
				// fail( "spec has not been implemented" );
			} );


			describe( "A Child Suite", function() {
				it(
					title  = "A Spec Thing",
					labels = "",
					skip   = false,
					body   = function() {
						expect( 1 ).toBe( 1 );
					}
				);
				it( "a child spec", function() {
					expect( 1 ).toBe( 1 );
				}, "smoke,item,thing" );



				describe( "A Child Child Suite", function() {
					it( "a child child spec", function() {
						expect( 1 ).toBe( 2);
					} );
					it( "a child spec", function() {
						expect( 1 ).toBe( 2 );
					} );
				} );
			} );
		} );


		describe( "My Second Suite", function() {
			it( "should fail", function() {
				expect( 2 ).toBe( 3 );
				// fail( 'Second spec has not been implemented' );
			} );
			it( "should throw", function() {
				// throw( 'A full thrown error!' );
			} );
			it( "should throw2", function() {
				throw( 'A full thrown error!' );
			} );

			xit( "should be skipped", function() {
				// fail( 'This spec should have been skipped' );
			} );
		} );
	}

}
