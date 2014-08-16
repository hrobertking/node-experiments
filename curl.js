/**
 * @author: hrobertking@cathmhaol.com
 *
 * exports.request = request;
 *
 */

var proc = require('child_process')        // process thread
  , events = require('events')             // event object in nodejs core
  , Readable = require('stream').Readable  // readable stream object in nodejs core
  , url = require('url')                   // url utilities
;

/**
 * Creates a request object that can be written to, to send data
 * @return	{object}
 * @param	{object} options
 * @param	{function} callback
 * @emits	'error'
 * @emits	'response'
 * @emits	'timeout'
 */
function request(options, callback) {
	'use strict';

	var args = ['-k', '--silent', '--show-error']  // arguments to pass into the curl process
	  , body                                       // response body
	  , curl                                       // the process
	  , emitter = new events.EventEmitter()        // event emitter
	  , hasResponse                                // a response has started coming
	  , header                                     // index for options.headers loop
	  , idleTime                                   // number of milliseconds the connection can be idle
	  , ms                                         // timestamp of the request
	  , t                                          // timeout interval object
	  , p                                          // ping interval object
	;

	/**
	 * Check to see if it has been idle enough to timeout
	 * @return	{void}
	 */
	function checkIdle() {
		var now = (new Date()).getTime();
		if (idleTime > 0) {
			if (ms + idleTime < now) {
				emitter.emit('timeout');
			}
		}
	}

	/**
	 * Sends a ping to keep the connection open
	 * @return	{void}
	 */
	function ping() {
		return;
	}

	/**
	 * Sends the curl command
	 * @return	{void}
	 */
	function sendCommand() {
		var output = new Readable
		  , header_req
		;

		// Add the other properties to 'output' to make it an http.IncomingMessage:
		// close event; headers: e.g., { 'user-agent': 'curl/7.22.0', 'host': '127.0.0.1:8000', 'accept': '*/*' };
		// httpVersion: e.g., '1.1'; method: http verb; setTimeout(ms, callback): calls connection setTimeout;
		// socket: null because we're not using an http socket; statusCode: the http status code; trailers:
		// headers in the trailer (http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.40); url: request
		// URL
		output.headers = '';
		output.httpVersion = null;
		output.method = (options.method || 'GET').toUpperCase();
		output.on = function(evt, callback) {
			if ((/^close$/i).test(evt)) {
				emitter.on('output_close', callback);
			}
		});
		output.setTimeout = function(ms, callback) {
			setSocketTimeout(ms, callback);
		});
		output.socket = null;
		output.statusCode = null;
		output.trailers = {};
		output.url = '';

		output.url += (options.protocol || 'http').replace(/\:$/, '') + '://';
		output.url += (options.port ? options.host + ':' + options.port : (options.hostname || options.host)) + '/';
		output.url += options.path;

		// Get all the headers to fill in the basic data
		header_req = proc.spawn('curl', ['-I', output.url]);
		header_req.stdout.on('data', function(chunk) {
			output.headers += chunk;
		});
		header_req.stdout.on('end', function() {
			if (output.headers && output.headers !== '') {
				var rows = output.headers.split(/\n/)
				  , ndx
				  , status = /\bhttp\/(\d\.\d)\s+(\d{3})\b/i
				  , parsed
				  , headers = {}
				  , trailers = {}
				;

				// Go through all the lines in the response
				for (ndx = 0; ndx < rows.length; ndx += 1) {
					// Check to see if it's the http version/status code line
					// and if it is, set those values, otherwise, treat it
					// like a header
					parsed = status.exec(rows[i]);
					if (parsed && parsed.length > 2) {
						output.httpVersion = parsed[1];
						output.statusCode = parsed[2];
					} else {
						parsed = rows[i].split(': ');
						// If the row is in the format 'Trailer: <header-name>'
						// e.g., Trailer: Content-MD5, add it the trailers
						if ((/\btrailer\b/i).test(parsed[0]) && parsed[1]) {
							trailers[parsed[1]] = trailers[parsed[1]] || '';
						} else {
							headers[parsed[0]] = parsed[1] || '';
						}
					}
				}
				// Go through all the trailers and try to get the values
				// Example: Trailer: Content-MD5 ..... ..... Content-MD5: 7895bf4b8828b55ceaf47747b4bca667
				for (ndx in trailers) {
					trailers[ndx] = headers[ndx];
				}
			}
		});

		// Set the callback to handle the events on the output stream
		if (callback) {
			emitter.on('response', callback);
		}

		// Add the url to the args for the real curl request
		args.push(output.url);

		// Reset the clock
		ms = (new Date()).getTime();

		// Do the request
		curl = proc.spawn('curl', args);

		// Send the data through stdout to the http.IncomingMessage created
		curl.stdout.on('data', function(chunk) {
			if (!hasResponse) {
				hasResponse = true;
				emitter.emit('response', output);
			}
			body = (body || '') + chunk;
			output.push(chunk);
		});
		curl.stdout.on('end', function() {
			output.push(null);
			emitter.emit('output_close');
		});

		// Set up the request error handler
		curl.stderr.on('data', function(chunk) {
			body = (body || '') + chunk;
		});
		curl.stderr.on('end', function() {
			emitter.emit('error', body);
			emitter.emit('output_close');
		});
	}

	/**
	 * Aborts the request
	 * @return	{void}
	 */
	this.abort = function() {
		curl.kill();
	};

	/**
	 * Closes the request, sending any specified data
	 * @return	{void}
	 * @param	{string} data
	 * @param	{string} encoding
	 */
	this.end = function(data, encoding) {
		this.write(data, encoding);
	};

	/**
	 * Subscribes to an event
	 * @return	{void}
	 * @param	{string} eventname
	 * @param	{function} handler
	 */
	this.on = function(eventname, handler) {
		var valid = (/^(error|response|timeout)$/i).test(eventname);
		if (valid) {
			emitter.on(eventname.toLowerCase(), handler);
		}
	};

	/**
	 * Disables the Nagle algorithm.
	 * @return	{void}
	 * @param	{boolean} value
	 */
	this.setNoDelay = function(value) {
		var i;
		if (value === true) {
			args.push('--tcp-nodelay');
		} else {
			for (i = 0; i < args.length; i += 1) {
				if (args[i] === '--tcp-nodelay') {
					args.splice(i, 1);
				}
			}
		}
	};

	/**
	 *
	 * @return	{void}
	 * @param	{boolean} enable
	 * @param	{number} initialDelay
	 */
	this.setSocketKeepAlive = function(enable, initialDelay) {
		//curl does not use a socket, so this function is meaningless
		if (enable === true && !isNaN(initialDelay) && initialDelay > 0) {
			p = setInterval(ping, Math.floor(initialDelay));
		} else if (p) {
			clearInterval(p);
		}
	};

	/**
	 * Sets the maximum duration to wait for a response.
	 * @return	{void}
	 * @param	{integer} ms
	 * @param	{function} callback
	 */
	this.setTimeout = function setSocketTimeout(ms, callback) {
		if (!isNaN(ms) && ms > 0) {
			idleTime = Math.floor(ms);
			t = setInterval(checkIdle, 10);
			emitter.on('timeout', callback);
		}
	};

	/**
	 * Writes data to the connection
	 * @return	{void}
	 * @param	{string} data
	 * @param	{string} encoding
	 */
	this.write = function(data, encoding) {
		if (data) {
			if (encoding === 'binary') {
				args.push('--data-binary ' + data);
			} else {
				args.push('-d ' + data);
			}
			sendCommand();
		}
	};

	// *****************************************************
	// Constructor
	// -----------------------------------------------------
	// Normalize the options:
	// - agent: Controls Agent behavior. When an Agent is used request will default to Connection: keep-alive. Possible values:
	// - auth: Basic authentication i.e. 'user:password' to compute an Authorization header.
	// - hash: The 'fragment' portion of the URL including the pound-sign.
	// - headers: An object containing request headers.
	// - host: The full lowercased host portion of the URL, including port information. Defaults to 'localhost' when parsed from a string.
	// - hostname: Just the lowercased hostname portion of the host.
	// - href: The full URL that was originally parsed. Both the protocol and host are lowercased.
	// - localAddress: Local interface to bind for network connections.
	// - method: A string specifying the HTTP request method. Defaults to 'GET'.
	// - path: Concatenation of pathname and search. Defaults to '/' when parsed from a string
	// - pathname: The path section of the URL, that comes after the host and before the query, including the initial slash if present.
	// - port: Port of remote server. Defaults to 80 when parsed from a string.
	// - protocol: The request protocol, lowercased.
	// - query: Either the 'params' portion of the query string, or a querystring-parsed object.
	// - search: The 'query string' portion of the URL, including the leading question mark.
	// - slashes: The protocol requires slashes after the colon
	// - socketPath: Unix Domain Socket (use one of host:port or socketPath)
	// -----------------------------------------------------
	if (typeof options === 'string') {
		options = url.parse(options);
	}
	options.method = options.method || 'GET';

	// Set authorization token
	if (options.auth) {
		args.push('-u ' + options.auth);
	}

	// Set headers
	if (options.headers) {
		for (header in options.headers) {
			if (options.headers.hasOwnProperty(header)) {
				args.push('--header "' + header + ': ' + options.headers[header] + '"');
			}
		}
	}

	// If the request is not a POST, we don't have any data to send, it's in the query string
	// so we go ahead and send the command. If it's a post, we delay the sendCommand until
	// the 'write' method is called.
	if (!(/\bPOST\b/i).test(options.method)) {
		sendCommand();
	}

	emitter.on('response', function() { hasResponse = true; });
	emitter.on('timeout', function() { if (t) { clearInterval(t); } });
	// *****************************************************

	return this;
}
exports.request = request;
