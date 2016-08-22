/**
 * A server message with request and response
 *
 * @author  hrobertking@cathmhaol.com
 *
 * @exports Message as create
 * @exports subscribe as on
 */

var events = require('events')              // nodejs core
  , emitter = new events.EventEmitter()     // event emitter
;

/**
 * Creates a request/response pair
 *
 * @return   {object}
 *
 * @param    {http.IncomingMessage} request
 * @param    {http.IncomingMessage} response
 */
function Message(request, response) {
  /**
   * Returns a log entry given a format and optionally, fields
   *
   * @return   {string}
   *
   * @param    {string} format
   * @param    {string[]} fields
   */
  this.toString = function(format, fields) {
    var entry = ''
      , mons = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    ;

    format = format || '';
    fields = fields || [ ];

    /**
     * Returns the NCSA, or common log format with extended information
     *
     * @return   {string}
     */
    function NCSA() {
      return ( request.connection.remoteAddress || '-' ) + '\t' +                               // Get the IP of the user-agent
          ( '-' ) + '\t' +                                                                      // RFC 1413 identity of client (not usually known)
          ( request.username || '-' ) + '\t' +                                                  // user id of end-user (not usually known)
          ( '[' + response.date.getDate() + '/' +                                               // Get completion time date
                  mons[response.date.getMonth()] + '/' +                                        // Get completion time month name
                  response.date.getFullYear() + ':' +                                           // Get completion time year
                  ('0' + response.date.getHours()).substr(-2) + ':' +                           // Get completion time hours
                  ('0' + response.date.getMinutes()).substr(-2) + ':' +                         // Get completion time minutes
                  ('0' + response.date.getSeconds()).substr(-2) + ' ' +                         // Get completion time seconds
                  ( (response.date.getTimezoneOffset() > 0 ? '-' : '') +                        // flip the sign - JS represents offset backwards
                    ('0' + Math.floor(response.date.getTimezoneOffset() / 60)).substr(-2) +     // Get the hours in the timezone offset
                    ('0' + (response.date.getTimezoneOffset() % 60)).substr(-2)                 // Get the minutes in the timezone offset
                  ) + ']' ) + '\t' +                                                            // Time response finished, format %d/%b/%Y:%H:%M:%S %z
          ( '"' + (request.method || 'GET' ) + ' ' +                                            // Get the HTTP verb from the request
                  (request.url || '-' ) + ' ' +                                                 // Get the url from the request
                  ('HTTP/' + (request.httpVersion || '1.0')) +                                  // Get the HTTP version from the request
                  ('"') ) + '\t' +                                                              // Request line
          ( response.statusCode || '-' ) + '\t' +                                               // HTTP status code
          ( Buffer.byteLength(response.data) || '-' )                                           // Bytes transfered to the client
          ;
    }

    /**
     * Returns the W3C log format
     *
     * @return   {string}
     */
    function W3C(elements) {
      var os = require('os')
        , field
        , header
        , parser = /cs\(([^\)]+)\)/
      ;

      /**
       * W3C format functions
       */
      function formatDate(dt) {
        if (dt && !isNaN(dt.getTime())) {
          return dt.getFullYear() + '-' + ('0' + (dt.getMonth() + 1)).substr(-2) + '-' + ('0' + dt.getDate()).substr(-2);
        } else {
          return '-';
        }
      }
      function formatTime(dt) {
        if (dt && !isNaN(dt.getTime())) {
          return ('0' + dt.getHours()).substr(-2) + ':' + ('0' + dt.getMinutes()).substr(-2) + ':' + ('0' + dt.getSeconds()).substr(-2);
        } else {
          return '-';
        }
      }

      for (field in elements) {
        switch (elements[field].toLowerCase()) {
          case 'c-ip':            // ip address of client
            elements[field] = (request.connection.remoteAddress || '-');
            break;
          case 'cs-bytes':        // bytes sent by the client
            elements[field] = (Buffer.byteLength(request.data) || '-');
            break;
          case 'cs-host':         // contents of 'host' header
            elements[field] = (request.headers['host'] || '-');
            break;
          case 'cs-method':       // http verb
            elements[field] = (request.method || 'GET' );
            break;
          case 'cs-uri-query':    // query passed to resource
            elements[field] = (request.url.split('?')[1] || '-');
            break;
          case 'cs-uri-stem':     // resource accessed
            elements[field] = (request.url.split('?')[0] || '-');
            break;
          case 'cs-username':     // username of authenticated user
            elements[field] = (request.username || '-');
            break;
          case 'cs-version':      // protocol version used by the client
            elements[field] = (request.httpVersion || '-');
            break;
          case 'date':            // date response sent
            elements[field] = formatDate(response.date);
            break;
          case 's-computername':  // name of computer the log entry is generated on
            elements[field] = (os.hostname() || '-');
            break;
          case 's-ip':            // ip address of computer log entry is generated on
            elements[field] = (request.connection.localAddress || '-');
            break;
          case 's-port':          // port number client is connected to
            elements[field] = (request.connection.localPort || '-');
            break;
          case 's-sitename':      // internet service and instance
            elements[field] = '-';
            break;
          case 'sc-bytes':        // bytes sent by the server
            elements[field] = Buffer.byteLength(response.data);
            break;
          case 'sc-status':       // http status code
            elements[field] = response.statusCode;
            break;
          case 'sc-win32-status': // status of the action in Windows terms
            break;
          case 'time':            // time response sent
            elements[field] = formatTime(response.date);
            break;
          case 'time-taken':      // duration of time in seconds (per W3C documentation)
            elements[field] = ((response.date.getTime() - request.date.getTime())/1000);
            break;
          default:                // anything else, like cs(<header>) fields
            header = parser.exec(elements[field]);
            if (header) {
              elements[field] = request.headers[header[1].toLowerCase()] || '-';
            } else {
              delete elements[field];
            }
        }
      }
      return elements.join(' ');
    }

    switch (format.toLowerCase()) {
      case 'common':
        entry = NCSA();
        break;
      case 'extended':
        entry = [NCSA(), W3C(['cs(Referer)', 'cs(User-Agent)'])].join('\t');
        break;
      case 'w3c':
        entry = W3C(fields);
        break;
      default:
        entry = [NCSA(), W3C(['cs(Referer)', 'cs(User-Agent)', 'time-taken'])].join('\t');
        break;
    }

    return entry;
  };

  /* ---------- Constructor ---------- */
  var qs = require('querystring')
    , url = require('url')
    , self = this
  ;

  function generateID() {
    var guid = '',
      rchar = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      rseed = 0,
      guid_length = 6;

    while (guid.length < guid_length) {
      guid += rchar.substr(Math.floor( Math.random() * (rchar.length - 1) ), 1);
    }

    return (new Date()).getTime() + guid;
  }

  self.id = generateID();

  // set the date-time the request is received
  request.date = new Date();
  response.date = new Date();

  // set the encoding
  request.setEncoding('utf8');
  // get the Basic Authorization username if it's present
  request.username = (new Buffer(((request.headers['authorization'] || '').split(/\s+/).pop() || ''), 'base64')).toString().split(/:/)[0];
  // set the request data handlers
  request.data = '';
  request.on('data', function(chunk) {
    request.data += chunk;
  });
  request.on('end', function() {
    request.cgi = qs.parse(request.method.toUpperCase() === 'POST' ? request.data : url.parse(request.url).query);
    // emit the request event
    emitter.emit('request-received', self);
  });

  // set the data handlers
  response.data = '';
  response.bytes_sent = 0;
  // override the write method because there aren't events fired when data is written to the stream
  response.send = response.write;
  response.write = function(chunk, encoding, callback) {
    response.data += chunk;
    response.bytes_sent = Buffer.byteLength(response.data);
    response.send(chunk, encoding, callback);
  };
  response.on('finish', function() {
    response.date = new Date();
    response.time_taken = ((response.date.getTime() - request.date.getTime())/1000);
    emitter.emit('response-sent', self);
  });

  self.request = request;
  self.response = response;
  return self;
}
exports.create = Message;

/**
 * Registers event handlers for request-received and response-sent
 *
 * @return   {void}
 *
 * @param    {string} eventname
 * @param    {function} handler
 */
function subscribe(eventname, handler) {
  if ((/request\-received|response\-sent/).test(eventname)) {
    emitter.removeListener(eventname, handler);
    emitter.on(eventname, handler);
  }
}
exports.on = subscribe;
