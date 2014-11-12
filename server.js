/**
 * A web server
 *
 * @author: hrobertking@cathmhoal.com
 *
 * @exports cert as cert
 * @exports host as host
 * @exports ip_auth as ip
 * @exports log_file as log
 * @exports port as port
 * @exports router as router
 * @exports start as start
 * @exports subscribe as on
 *
 * @see The <a href="https://github.com/hrobertking/node-experiments">node-experiments</a> repo for information about the router module
 */

var events = require('events')                        // nodejs core
  , fs = require('fs')                                // nodejs core
  , http = require('http')                            // nodejs core
  , message = require('./message')                    // message module
  , router = require('./router')                      // application-specific router
  , emitter = new events.EventEmitter()               // event emitter
  , host                                              // the hostname or host address
  , ip_auth = [ ]                                     // array of IPv4 clients authorized
  , log_file                                          // filename of the log
  , port                                              // port used by web-server to listen
  , ssl_options = { cert:null, key:null, pfx:null }   // ssl options object to contain 'key' and 'cert'
;

/**
 * The address the server will created on
 *
 * @type     {string}
 */
Object.defineProperty(exports, 'host', {
  get: function() {
    return host;
  },
  set: function(value) {
    if (typeof value === 'string' && value !== '') {
      host = value;
    }
  }
});

/**
 * The IP addresses authorized to access the server
 *
 * @type     {string}
 */
Object.defineProperty(exports, 'ip', {
  get: function() {
    return ip_auth.join(',');
  },
  set: function(value) {
    function isValid(ip) {
      var seg = ip.split('.')
        , i
        , ok = (seg.length > 0)
      ;
      for (i = 0; i < seg.length; i += 1) {
        if (isNaN(seg[i])) {
          ok = ok && seg[i] === '*';
        } else {
          ok = ok && (parseFloat(seg[i]) > -1 && parseFloat(seg[i]) < 256);
        }
      }
      return ok;
    }
    var autho, c;
    if (typeof value === 'string' && value !== '') {
      autho = value.split(',');
      for (c = 0; c < autho.length; c += 1) {
        if (!isValid(autho[c])) {
          autho.splice(c, 1);
        }
      }
      if (autho.length) {
        ip_auth = autho;
      }
    }
  }
});

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
 * Expose the router interface
 *
 * @type     {object}
 */
Object.defineProperty(exports, 'router', {
  get: function() {
    return router;
  },
  set: function(value) {
    router = value;
  }
});

/**
 * Checks the client IP against authorized clients
 *
 * @return   {boolean}
 *
 * @param    {request} req
 */
function authorizedClient(req) {
  var ndx
    , ok = (ip_auth.length === 0) // assume it isn't authorized
    , ip
    , regex
  ;
  for (ndx = 0; ndx < ip_auth.length; ndx += 1) {
    ip = '^' + ip_auth[ndx].replace(/\./g, '\\.').replace(/\*/g, '\\d{1,3}');
    regex = new RegExp(ip);
    ok = ok || regex.test(req.connection.remoteAddress);
  }
  return ok;
}

/**
 * Sets the ssl options
 *
 * @return   {void}
 *
 * @param    {string} key
 * @param    {string} certificate
 */
function cert(key, certificate) {
  var path = require('path')
    , base64 = /^([A-Z0-9\+\/]{4})*([A-Z0-9\+\/]{4}|[A-Z0-9\+\/]{3}=|[A-Z0-9\+\/]{2}==)$/i
    , contents = {
        cert:null,
        key:null,
        pfx:null
      }
    ;


  // check the 'key' to see if it's likely that it's base64 encoded
  if (base64.test(key)) {
    contents.key = key;
  } else {
    // figure out if we have a pfx or a key/certificate pair
    switch (path.extname(key).replace(/^\./, '')) {
      case 'pem':
        try {
          contents.key = fs.readFileSync(key);
        } catch(ignore) {
        }
        break;
      case 'pfx':
        try {
          contents.pfx = fs.readFileSync(key);
        } catch(ignore) {
        }
        break;
    }
  }

  // check the 'certificate' to see if it's likely that it's base64 encoded
  if (base64.test(certificate)) {
    contents.cert = certificate;
  } else {
    // figure out if we have a pfx or a key/certificate pair
    switch (path.extname(certificate).replace(/^\./, '')) {
      case 'pem':
        try {
          contents.cert = fs.readFileSync(certificate);
        } catch(ignore) {
        }
        break;
      case 'pfx':
        try {
          contents.pfx = fs.readFileSync(certificate);
        } catch(ignore) {
        }
        break;
    }
  }

  // set the ssl_options - test truthy so we skip empty strings
  if (contents.cert) {
    ssl_options.cert = contents.cert;
  }
  if (contents.key) {
    ssl_options.key = contents.key;
  }
  if (contents.pfx) {
    ssl_options.pfx = contents.pfx;
  }
}
exports.cert = cert;

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
  entry = entry.toString() + '\n';

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
    if (!authorizedClient(request)) {
      request.forbidden = true;
    }
    router.pass(message.create(request, response));
  }

  // route the request
  router.on('request-received', function(message) {
    emitter.emit('request-received', message);

    // sleep if it's requested
    if (message.request && message.request.cgi && message.request.cgi.latency) {
      sleep(message.request.cgi.latency);
    }

    // route the message
    router.route(message);
  });
  // set the handler to log responses sent
  router.on('response-sent', function(message) {
    if (message.response) {
      message.response.date = message.response.date || new Date();
      message.response.end();
    }
    emitter.emit('response-sent', message);
    log(message);
  });
  // set the handler to log routing errors
  router.on('route-error', function(message) {
    if (message.response) {
      message.response.date = message.response.date || new Date();
      message.response.end();
    }
    emitter.emit('response-sent', message);
    log(message);
  });

  // handle log errors
  emitter.on('log-error', function(params) {
    console.log('Error: ' + params.error);
    console.log(params.entry);
  });

  // create the server to listen on the specified host and port
  if ((ssl_options.key && ssl_options.cert) || ssl_options.pfx) {
    // create a secure server
    https.createServer(ssl_options, onRequest).listen(port, host);
  } else {
    http.createServer(onRequest).listen(port, host);
  }
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
