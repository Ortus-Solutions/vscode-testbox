const LogLevel = {
	NONE       : 100,
	ERROR      : 2,
	WARN       : 1,
	INFO       : 0,
	DEBUG      : -1,
	TRACE      : -2,
	DEEP_TRACE : -3
};

const loggerName = "[TestBox]";

class Logger {

	/**
	 * Constructor
	 *
	 * @param {*} level The log level
	 */
	constructor( level ) {
		this.level = level;
	}

	format( msg, placeholders ) {
		let result = "";
		let i = 0;
		let placeholderIndex = 0;
		while ( i < msg.length ) {
			const c = msg.charAt( i );
			const next = msg.charAt( i + 1 );
			if ( c === "{" && next === "}" ) {
				result += placeholders[placeholderIndex];
				placeholderIndex++;
				i += 2;
			} else {
				result += c;
				i++;
			}
		}
		return result;
	}

	log( prefix, level, msg, placeholders ) {
		if ( level >= this.level ) {
			console.log( prefix + this.format( msg, placeholders ) );
		}
	}

	error( msg, ...placeholders ) { this.log( loggerName + " [ERROR] ", LogLevel.ERROR, msg, placeholders ); }

	warn( msg, ...placeholders ) { this.log( loggerName + " [WARN] ", LogLevel.WARN, msg, placeholders ); }

	info( msg, ...placeholders ) { this.log( loggerName + " [INFO] ", LogLevel.INFO, msg, placeholders ); }

	debug( msg, ...placeholders ) { this.log( loggerName + " [DEBUG] ", LogLevel.DEBUG, msg, placeholders ); }

	trace( msg, ...placeholders ) { this.log( loggerName + " [TRACE] ", LogLevel.TRACE, msg, placeholders ); }

	deepTrace( msg, ...placeholders ) { this.log( loggerName + " [DEEP_TRACE] ", LogLevel.DEEP_TRACE, msg, placeholders ); }
}

const LOG = new Logger( LogLevel.INFO );

module.exports = {
	Logger,
	LogLevel,
	LOG,
	loggerName
};
