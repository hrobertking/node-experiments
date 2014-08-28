/**
 * @author: hrobertking@cathmhoal.com
 *
 * exports.on = on;
 * exports.port = port;
 * exports.start = start;
 *
 */

var events = require('events')              // nodejs core
  , http = require('http')                  // nodejs core
  , router = require('./router')            // application-specific router
  , message                                 // request-response pair
  , port                                    // port used by web-server to listen
  , emitter = new events.EventEmitter()     // event emitter
;

/**
 * The port the server will listen on
 * @type  {number}
 */
Object.defineProperty(exports, 'port', {
	get: function() {
		return port;
	},
	set: function(value) {
		if (!isNaN(value)) {
			port = Math.floor(value);
		}
	}
});

/**
 * Creates a request/response pair
 * @return   {object}
 * @param    {http.IncomingMessage} request
 * @param    {http.IncomingMessage} response
 */
function Message(request, response) {
	this.request = request;
	this.response = response;
	return this;
}

/**
 * Logs the data
 * @return   {void}
 * @param    {server.Message} entry
 */
function log(entry) {
      var  mons = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      console.log( ( entry.request.connection.remoteAddress || '-' ) + '\t' +                           // Get the IP of the user-agent
            ( '-' ) + '\t' +                                                                            // RFC 1413 identity of client (not usually known)
            ( '-' ) + '\t' +                                                                            // user id of end-user (not usually known)
            ( '[' + entry.response.date.getDate() + '/' +                                               // Get completion time date
                    mons[entry.response.date.getMonth()] + '/' +                                        // Get completion time month name
                    entry.response.date.getFullYear() + ':' +                                           // Get completion time year
                    ('0' + entry.response.date.getHours()).substr(-2) + ':' +                           // Get completion time hours
                    ('0' + entry.response.date.getMinutes()).substr(-2) + ':' +                         // Get completion time minutes
                    ('0' + entry.response.date.getSeconds()).substr(-2) + ' ' +                         // Get completion time seconds
                    ( (entry.response.date.getTimezoneOffset() > 0 ? '-' : '') +                        // flip the sign - JS represents offset backwards
                      ('0' + Math.floor(entry.response.date.getTimezoneOffset() / 60)).substr(-2) +     // Get the hours in the timezone offset
                      ('0' + (entry.response.date.getTimezoneOffset() % 60)).substr(-2)                 // Get the minutes in the timezone offset
                    ) + ']' ) + '\t' +                                                                  // Time response finished, format %d/%b/%Y:%H:%M:%S %z
            ( '"' + (entry.request.method || 'GET' ) + ' ' +                                            // Get the HTTP verb from the request
                    (entry.request.url || '-' ) + ' ' +                                                 // Get the url from the request
                    ('HTTP/' + (entry.request.httpVersion || '1.0')) +                                  // Get the HTTP version from the request
                    ('"') ) + '\t' +                                                                    // Request line
            ( entry.response.statusCode || '-' ) + '\t' +                                               // HTTP status code
            ( entry.response.bytes || '-' )
          );
}

/**
 * Waits for a specified period of time, in milliseconds, to elapse
 * @return   {void}
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
 * @return   {void}
 * @param    {integer} listento
 * @emits    request-received
 * @emits    response-sent
 */
function start(listento) {
	// set the port if it's passed in
	if (listento) {
		if (!isNaN(listento)) {
			port = Math.floor(listento);
		}
	}

	function onRequest(request, response) {
		var qs = require('querystring') // nodejs core
		  , url = require('url')        // nodejs core
		  , bytes_out = 0               // bytes written by writer
		  , bytes_in = 0                // bytes read from request
		  , posted = ''                 // data sent in the request
		  , auth
		;

		auth = (new Buffer(((request.headers['authorization'] || '').split(/\s+/).pop() || ''), 'base64')).toString().split(/:/)[0];

		// set the globals
		message = new Message(request, response);
		message.request.date = new Date();
		message.request.setEncoding('utf8');
		message.request.username = auth;
		message.request.on('data', function(chunk) {
			posted += chunk;
			bytes_in += Buffer.byteLength(chunk);
		});
		message.request.on('end', function() {
			message.request.bytes = bytes_in;
			message.request.data_sent = posted;
			message.request.cgi = qs.parse(message.request.method === 'POST' ? message.request.data_sent : url.parse(message.request.url).query);

			// emit the request event
			emitter.emit('request-received', message);

			// sleep if it's requested
			if (message.request.cgi.latency) {
				sleep(message.request.cgi.latency);
			}

			// route the message
			router.route(message);
		});
	}

	// set the handler to log responses sent
	router.on('response-sent', function(data) {
		data.response.date = new Date();
		log(data);
		emitter.emit('response-sent', message);
		data.response.end();
	});

	// create the server to listen on the specified port
	http.createServer(onRequest).listen(port);

	// log that the server is started
	console.log('\nServer has started on ' + port);
}
exports.start = start;

/**
 * Registers event handlers for request-received and response-sent events
 * @return   {void}
 * @param    {string} eventname
 * @param    {function} handler
 */
function subscribe(eventname, handler) {
	if ((/request\-received|response\-sent/).test(eventname)) {
		emitter.on(eventname, handler);
	}
}
exports.on = subscribe;
