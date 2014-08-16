/**
 * @author: hrobertking@cathmhoal.com
 *
 * exports.routes = routes;
 * exports.route = route;
 *
 */

var fs = require('fs')
  , path = require('path')
  , querystring = require('querystring')
  , url = require('url')
  , writer = require('./writer')
  , routes = {}
  , uri                           // the uri requested - http://nodejs.org/api/url.html
  , pathname                      // path
;

/**
 * Routes
 */
routes['/favicon.ico'] = ignoreRequest;

Object.defineProperty(exports, 'routes', {
	get: function() {
		return routes;
	}
});

function ignoreRequest(request, response) {
	writer.writeContentType(response, 'html', 0);
	writer.writeClose(response);
}

function defaultHandler(request, response) {
	var filename = path.join(process.cwd(), pathname)                 // the filename represented by the uri
	  , qs = querystring.parse((uri.search || '').replace(/\?/, ''))  // object representing the query string
	  , cgivar                                                        // generic looping index
	;

	// loop through all cgi variables
	for (cgivar in qs) {
		console.log(cgivar + ' = ' + qs[cgivar]);
	}

	// check the path against the file system
	fs.exists(filename, function(exists) {
		if (exists && fs.statSync(filename).isDirectory()) {
			filename += '/index.htm';
			fs.exists(filename, function(exists) {
				if (exists) {
					fs.readFile(filename, 'binary', function(err, file) {
						if (err) {
							writer.writeServerError(response, err);
						} else {
							writer.writeAsFile(response, file);
						}
					});
				} else {
					writer.writeNotFound(response);
				}
			});
		} else if (exists) {
			fs.readFile(filename, 'binary', function(err, file) {
				if (err) {
					writer.writeServerError(response, err);
				} else {
					writer.writeAsFile(response, file);
				}
			});
		} else {
			writer.writeNotFound(response);
		}
	});
}

function route(request, response) {
	var handler;

	uri = url.parse(request.url);
	pathname = uri.pathname;
	handler = routes[pathname];

	if (typeof handler === 'function') {
		handler(request, response);
	} else {
		defaultHandler(request, response);
	}
}
exports.route = route;
