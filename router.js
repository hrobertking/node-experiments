/**
 * @author: hrobertking@cathmhoal.com
 *
 * exports.on = subscribe;
 * exports.routes = routes;
 * exports.route = route;
 *
 */

var events = require('events')
  , writer = require('./writer')
  , emitter = new events.EventEmitter()     // event emitter
  , routes = { }                            // routing table
  , uri                                     // the uri requested - http://nodejs.org/api/url.html
;

/* v -------------------------- ROUTING HANDLERS -------------------------------- v */
routes['/favicon.ico'] = ignored;

/**
 * Ignores the request
 * @return   {message}
 * @param    {server.Message} message
 * @emits    response-sent
 */
function ignored(message) {
	emitter.emit('response-sent', writer.writeEmptyDocument(message));
}

/* ^ -------------------------- ROUTING HANDLERS -------------------------------- ^ */

/**
 * Handles requests not otherwise routed
 * @return   {message}
 * @param    {server.Message} message
 * @emits    response-sent
 * @emits    error
 */
function unhandled(message) {
	var fs = require('fs')
	  , path = require('path')
	  , filename = path.join(process.cwd(), uri.pathname)                 // the filename represented by the uri
	;

	try {
		// check the path against the file system
		fs.exists(filename, function(exists) {
			if (exists && fs.statSync(filename).isDirectory()) {
				filename += '/index.htm';
				fs.exists(filename, function(exists) {
					if (exists) {
						emitter.emit('response-sent', writer.writeAsFile(message, fs.readFileSync(filename, 'binary')));
					} else {
						emitter.emit('response-sent', writer.writeNotFound(message));
					}
				});
			} else if (exists) {
				emitter.emit('response-sent', writer.writeAsFile(message, fs.readFileSync(filename, 'binary')));
			} else {
				emitter.emit('response-sent', writer.writeNotFound(message));
			}
		});
	} catch (err) {
		emitter.emit('error', writer.writeServerError(message, err));
	}
}

/**
 * The routing table
 * @type     {object}
 */
Object.defineProperty(exports, 'routes', {
	get: function() {
		return routes;
	}
});

/**
 * Routes a request to a response
 * @return   {void}
 * @param    {server.Message} message
 * @emits    error
 */
function route(message) {
	var url = require('url')
	  , handler
	;

	// set the URI used by all the functions
	uri = url.parse(message.request.url);

	// get the handler for the requested resource
	handler = routes[uri.pathname] || unhandled;

	if (typeof handler === 'function') {
		handler(message);
	} else {
		// oops.
		emitter.emit('error', writer.writeServerError(message, 'Unable to route request'));
	}
}
exports.route = route;

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
