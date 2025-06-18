const os = require( "os" );
const path = require( "path" );
const fs = require( "fs" );

// To enable on macOS

// xattr -d com.apple.quarantine ./resources/cftokens/cftokens_osx_arm
function getCFTokensBinaryPath( overridePlatform, overrideArch ) {
	const platform = overridePlatform || os.platform(); // 'win32' | 'darwin' | 'linux'
	const arch = overrideArch || os.arch(); // 'x64' | 'arm64' | 'ia32' etc.
	let filename;

	if ( platform === "win32" ) {
		filename = "cftokens.exe";
	} else if ( platform === "darwin" ) {
		if ( arch === "arm64" ) {
			filename = "cftokens_osx_arm";
		} else if ( arch === "x64" ) {
			filename = "cftokens_osx_x86_64";
		} else {
			filename = "cftokens_osx"; // fallback
		}
	} else if ( platform === "linux" ) {
		// Attempt musl first for broader compatibility, fallback to glibc
		const musl = path.join(

			__dirname,
			"..",
			"resources",
			"cftokens",
			"cftokens_linux_musl"
		);
		if ( fs.existsSync( musl ) ) { return musl; }
		filename = "cftokens_linux";
	} else {
		throw new Error( `Unsupported platform: ${platform}` );
	}

	const fullPath = path.join(

		__dirname,
		"..",
		"..",
		"resources",
		"cftokens",
		filename
	);
	if ( !fs.existsSync( fullPath ) ) {
		throw new Error( `Binary not found for platform: ${platform} arch: ${arch}` );
	}

	return fullPath;
}

module.exports = { getCFTokensBinaryPath };
