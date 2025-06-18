const { getCFTokensBinaryPath } = require( "../../src/utils/cftokensLoader" );
const os = require( "os" );


describe( "Gets the right cftokens", () => {
	it( "should return the correct hash for a given string", () => {
		const path = getCFTokensBinaryPath( "win32", "arm64" );

	} );

	it( "should not throw an error for valid inputs", () => {
		expect( () => getCFTokensBinaryPath( "win32", "arm64" ) ).not.toThrow();
		expect( () => getCFTokensBinaryPath( "linux", "x64" ) ).not.toThrow();
		expect( () => getCFTokensBinaryPath( "darwin", "x64" ) ).not.toThrow();
		expect( () => getCFTokensBinaryPath( "darwin", "arm64" ) ).not.toThrow();
	} );

	it( "should throw an error for invalid inputs", () => {
		expect( () => getCFTokensBinaryPath( "invalidOS", "arm64" ) ).toThrow();

	} );

	it( "should handle the current OS and architecture without throwing", () => {
		const currentOS = os.platform();
		const currentArch = os.arch();
		expect( () => getCFTokensBinaryPath( currentOS, currentArch ) ).not.toThrow();
	} );
} );


