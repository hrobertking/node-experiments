/**
 * @author: hrobertking@cathmhoal.com
 *
 * @exports root_dir as dir
 * @exports handle as pass
 * @exports route as route
 * @exports routes as routes
 * @exports subscribe as on
 *
 * @see The <a href="https://github.com/hrobertking/node-experiments">node-experiments</a> repo for information about the writer module
 */

var events = require('events')
  , writer = require('./writer')
  , emitter = new events.EventEmitter()     // event emitter
  , root_dir = process.cwd()                // the root directory for the web server
  , routes = { }                            // routing table
  , uri                                     // the uri requested - http://nodejs.org/api/url.html
;

/* v ---------------------- ROUTING HANDLERS ---------------------------- v */
routes['/favicon.ico'] = ignored;

// add application-specific code here --
// Example
// routes['/foo-bar'] = function(message) {
//    var path = require('path')
//      , querystring = require('querystring')
//    ;
//    // set the log filename when events should be logged
//    err_log = path.join(__dirname, './logs/error.log');
//
//    // handle the request
//    emitter.emit('response-sent', writer.writeNotFound(message));
// };
/* ^ ---------------------- ROUTING HANDLERS ---------------------------- ^ */

/**
 * The base directory used to serve the requests
 *
 * @type     {string}
 */
Object.defineProperty(exports, 'dir', {
  get: function() {
    return root_dir;
  },
  set: function(value) {
    // if the directory exists, use it
    var fs = require('fs');
    if (typeof value === 'string') {
      try { 
        if (fs.statSync(value).isDirectory()) {
          root_dir = value;
        }
      } catch (ignore) {
        console.log(value + ' is not a valid directory');
      }
    }
  }
});

/**
 * The routing table
 *
 * @type     {object}
 */
Object.defineProperty(exports, 'routes', {
  get: function() {
    return routes;
  }
});

/**
 * Ignores the request by sending back an empty document with a 200 status code
 *
 * @return   {message}
 *
 * @param    {server.Message} message
 *
 * @emits    response-sent
 */
function ignored(message) {
  emitter.emit('response-sent', writer.writeEmptyDocument(message));
}

/**
 * Handles requests not otherwise routed
 *
 * @return   {message}
 *
 * @param    {server.Message} message
 *
 * @emits    response-sent
 * @emits    error
 */
function unhandled(message) {
  var fs = require('fs')
    , path = require('path')
    , filename = path.join(root_dir, uri.pathname)
  ;

  try {
    // check the path against the file system
    if (fs.existsSync(filename)) {
      if (fs.statSync(filename).isDirectory()) {
        filename += '/index.htm';
        filename += !fs.existsSync(filename) ? 'l' : '';
        if (fs.existsSync(filename)) {
          emitter.emit('response-sent', writer.writeAsFile(message, 
                   fs.readFileSync(filename, 'binary'), 
                   path.extname(filename).replace(/^\./, ''))
          );
        } else {
          emitter.emit('response-sent', writer.writeNotFound(message));
        }
      } else {
        emitter.emit('response-sent', writer.writeAsFile(message,
                   fs.readFileSync(filename, 'binary'), 
                   path.extname(filename).replace(/^\./, ''))
        );
      }
    } else {
      emitter.emit('response-sent', writer.writeNotFound(message));
    }
  } catch (err) {
    emitter.emit('error', writer.writeServerError(message, err));
  }
}

/**
 * Starts the handling
 * @return   {void}
 * @param    {server.Message} message
 * @emits    request-received
 */
function handle(message) {
  // listen for the end event on the request to make sure we have complete data
  message.on('request-received', function() {
    emitter.emit('request-received', message);
  });
}
exports.pass = handle;

/**
 * Routes a request to a response
 *
 * @return   {void}
 *
 * @param    {server.Message} message
 *
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
    emitter.emit('error', writer.writeServerError(message, 
       'Unable to route request')
    );
  }
}
exports.route = route;

/**
 * Registers event handlers for request-received and response-sent events
 *
 * @return   {void}
 *
 * @param    {string} eventname
 * @param    {function} handler
 */
function subscribe(eventname, handler) {
  if ((/request\-received|response\-sent/).test(eventname)) {
    emitter.on(eventname, handler);
  }
}
exports.on = subscribe;
