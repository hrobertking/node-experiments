/**
 * A web server
 *
 * @author: hrobertking@cathmhoal.com
 *
 * @exports log_file as log
 * @exports subscribe as on
 * @exports port as port;
 * @exports start as start;
 *
 * @see The <a href="https://github.com/hrobertking/node-experiments">node-experiments</a> repo for information about the router module
 */

var events = require('events')              // nodejs core
  , fs = require('fs')                      // nodejs core
  , http = require('http')                  // nodejs core
  , message = require('./message')          // message module
  , router = require('./router')            // application-specific router
  , log_file                                // filename of the log
  , message                                 // request-response pair
  , port                                    // port used by web-server to listen
  , emitter = new events.EventEmitter()     // event emitter
;

/**
 * The filename the server will log to
 *
 * @type     {string}
 */
Object.defineProperty(exports, 'log', {
	get: function() {
		return log_file;
	},
	set: function(value) {
		if (typeof value === 'string' && value !== '') {
			log_file = value;
		}
	}
});

/**
 * The port the server will listen on
 *
 * @type     {number}
 */
Object.defineProperty(exports, 'port', {
	get: function() {
		return port;
	},
	set: function(value) {
		// use a 16-bit unsigned int, positive values only
		if (!isNaN(value) && value > 0 && value < 65536) {
			port = Math.floor(value);
		}
	}
});

/**
 * Logs the data
 *
 * @return   {void}
 *
 * @param    {server.Message} entry
 *
 * @emits    log-error
 */
function log(entry) {
	entry = entry.toString();

	if (log_file && log_file !== '') {
		fs.appendFile(log_file, entry, function(err) {
			if (err) {
				emitter.emit('log-error', {error: err, entry:entry});
			}
		});
	} else {
		console.log(entry);
	}
}

/**
 * Waits for a specified period of time, in milliseconds, to elapse
 *
 * @return   {void}
 *
 * @param    {integer} ms
 */
function sleep(ms) {
	var end = (new Date()).getTime() + (isNaN(ms) ? 0 : Math.floor(ms))
	  , tick = 0
	;
	while ((new Date()).getTime() < end) {
		tick += 1;
	}
	return;
}

/**
 * Starts the server
 *
 * @return   {void}
 *
 * @param    {integer} listento
 *
 * @emits    request-received
 * @emits    response-sent
 */
function start(listento) {
	// set the port if it's passed in
	if (listento) {
		if (!isNaN(listento) && listento > 0 && listento < 65536) {
			port = Math.floor(listento);
		}
	}

	// request handler
	function onRequest(request, response) {
		var qs = require('querystring') // nodejs core
		  , url = require('url')        // nodejs core
		  , bytes_out = 0               // bytes written by writer
		  , bytes_in = 0                // bytes read from request
		  , posted = ''                 // data sent in the request
		  , auth
		;

		router.pass(message.create(request, response));
	}

	// route the request
	router.on('request-received', function(message) {
		emitter.emit('request-received', message);

		// sleep if it's requested
		if (message.request.cgi.latency) {
			sleep(message.request.cgi.latency);
		}

		// route the message
		router.route(message);
	});
	// set the handler to log responses sent
	router.on('response-sent', function(message) {
		emitter.emit('response-sent', message);
		log(message);
	});

	// handle log errors
	emitter.on('log-error', function(params) {
		console.log('Error: ' + params.error);
		console.log(params.entry);
	});

	// create the server to listen on the specified port
	http.createServer(onRequest).listen(port);
}
exports.start = start;

/**
 * Registers event handlers for request-received, response-sent, and log-error events
 *
 * @return   {void}
 *
 * @param    {string} eventname
 * @param    {function} handler
 */
function subscribe(eventname, handler) {
	if ((/request\-received|response\-sent|log\-error/).test(eventname)) {
		emitter.on(eventname, handler);
	}
}
exports.on = subscribe;
