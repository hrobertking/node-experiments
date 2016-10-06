/**
 * A server message with request and response
 *
 * @author  hrobertking@cathmhaol.com
 *
 * @emits 'request-received'
 * @emits 'response-sent'
 * 
 * @exports Message as create
 * @exports subscribe as on
 */

var events = require('events')              /* nodejs core   */
  , emitter
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
   * The log entry data
   */
  this.log = { };

  /**
   * The address of the message. Contains port, family, and address
   * @type     {object}
   */
  this.origin = { address:'', family:'', port:'' };

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
    ;

    format = format || '';
    fields = fields || [ ];

    /**
     * Returns the NCSA, or common log format with extended information
     *
     * @return   {string}
     */
    function __CommonLogFormat() {
      var msg_date = new Date(self.log['date'])
        , mos = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      ;

      msg_date = msg_date.getDate() + '/' +
           mos[msg_date.getMonth()] + '/' +
           msg_date.getFullYear() + ':' +
           ('0' + msg_date.getHours()).substr(-2) + ':' +
           ('0' + msg_date.getMinutes()).substr(-2) + ':' +
           ('0' + msg_date.getSeconds()).substr(-2) + ' ' +
           (
             (msg_date.getTimezoneOffset() > 0 ? '-' : '') +
             ('0' + Math.floor(msg_date.getTimezoneOffset() / 60)).substr(-2) +
             ('0' + (msg_date.getTimezoneOffset() % 60)).substr(-2)
            );

      return ( self.log['c-ip'] || '-' ) + '\t' +
          ( self.log['cs-logname'] || '-' ) + '\t' +
          ( self.log['cs-username'] || '-' ) + '\t' +
          ( '[' + msg_date + ']' ) + '\t' +
          ( '"' + (self.log['cs-method'] || 'GET' ) + ' ' +
                  ((
                    (self.log['cs-uri-stem'] || '') + 
                    (self.log['cs-uri-query'] || '')
                   ) || '-' 
                  ) + ' ' +
                  ('HTTP/' + (self.log['cs-version'] || '1.0')) +
                  ('"') ) + '\t' +
          ( self.log['sc-status'] || '-' ) + '\t' +
          ( self.log['sc-bytes'] || '-' )
          ;
    }

    /**
     * Returns the virtual host
     *
     * @return   {string}
     */
    function __VirtualHost() {
      return self.log['s-ip'] + (self.log['s-port'] ? ':' : '') + self.log['s-port'];
    }

    /**
     * Returns the W3C log format
     *
     * @return   {string}
     */
    function __W3C(elements) {
      var field;

      for (field in elements) {
        field = field.toLowerCase();
        elements[field] = self.log[field] || '-';
      }

      return elements.join(' ');
    }

    switch (format.toLowerCase()) {
      case 'common':
        entry = __CommonLogFormat();
        break;
      case 'extended': /* NCSA extended or combined log format */
        entry = [ __CommonLogFormat(),
                  self.log['cs(Referer)'],
                  self.log['cs(User-Agent)']
                ].join('\t');
        break;
      case 'host':
        entry = [ __VirtualHost(),
                  __CommonLogFormat()
                ].join('\t');
        break;
      case 'w3c':
        entry = __W3C(fields);
        break;
      default:
        entry = [ __VirtualHost(),
                  __CommonLogFormat(),
                  self.log['cs(Referer)'],
                  self.log['cs(User-Agent)'],
                  self.log['time-taken']
                ].join('\t');
        break;
    }

    return entry;
  };

  /* ---------- Constructor ---------- */
  var qs = require('querystring')
    , url = require('url')
    , self = this
  ;

  /* set the origin of the message */
  try {
    this.origin = request.socket.address();
  } catch(ignore) {
    /* we'll ignore any exception raised by calling the address method */
  }

  function __generateId() {
    var guid = '',
      rchar = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      rseed = 0,
      guid_length = 6;

    while (guid.length < guid_length) {
      guid += rchar.substr(Math.floor( Math.random() * (rchar.length - 1) ), 1);
    }

    return (new Date()).getTime() + '::' + guid;
  }
  self.id = self.origin.address + '::' +
            self.origin.port + '::' + 
            __generateId();

  function __log() {
    var os = require('os')
      , t = /(\d{2}\:\d{2}\:\d{2})/
    ;

    function __iso8601(dt) {
      if (dt && !isNaN(dt.getTime())) {
        return (dt.getFullYear()) + '-' + 
               ('0' + (dt.getMonth() + 1)).substr(-2) + '-' +
               ('0' + dt.getDate()).substr(-2) + 'T' +
               ('0' + dt.getHours()).substr(-2) + ':' +
               ('0' + dt.getMinutes()).substr(-2) + ':' +
               ('0' + dt.getSeconds()).substr(-2) + '.' +
               ('000' + dt.getMilliseconds()).substr(-3);
      } else {
        return '-';
      }
    }

    /* remote logname is only available if mod_ident is present and IdentityCheck is on */
    self.log['cs-logname'] = '-';

    self.log['c-ip'] = request.connection.remoteAddress;
    self.log['cs-bytes'] = Buffer.byteLength(request.data);
    self.log['cs-host'] = request.headers['host'];
    self.log['cs-method'] = request.method;
    self.log['cs-uri-query'] = request.url.split('?')[1];
    self.log['cs-uri-stem'] = request.url.split('?')[0];
    self.log['cs-username'] = request.username;
    self.log['cs-version'] = request.httpVersion;
    self.log['date'] = __iso8601(response.date);
    self.log['s-computername'] = os.hostname();
    self.log['s-ip'] = self.origin.address || request.connection.localAddress;
    self.log['s-port'] = self.origin.port || request.connection.localPort;
    self.log['s-sitename'] = '';
    self.log['sc-bytes'] = response.bytes;
    self.log['sc-status'] = response.statusCode;

    self.log['time-taken'] = (self.response.date || new Date()).getTime() - (self.request.date || new Date()).getTime();

    t = t.exec(self.log['date']);
    self.log['time'] = t ? t[1] : '';
  }

  /* set the date-time the request is received */
  request.date = new Date();
  response.date = new Date();

  /* set the encoding */
  request.setEncoding('utf8');
  /* get the Basic Authorization username if it's present */
  request.username = (new Buffer(((request.headers['authorization'] || '').split(/\s+/).pop() || ''), 'base64')).toString().split(/:/)[0];
  /* set the request data handlers */
  request.data = '';
  request.on('data', function(chunk) {
    request.data += chunk;
  });
  request.on('end', function() {
    request.cgi = qs.parse(request.method.toUpperCase() === 'POST' ? request.data : url.parse(request.url).query);
    __log();
    /* emit the request event */
    emitter.emit('request-received', self);
  });

  /* set the data handlers */
  response.data = '';
  /* override the write method because there aren't events fired when data is written to the stream */
  response.send = response.write;
  response.write = function(chunk, encoding, callback) {
    response.data += chunk;
    response.send(chunk, encoding, callback);
  };
  response.on('finish', function() {
    response.date = new Date();
    __log();
    emitter.emit('response-sent', self);
  });

  self.request = request;
  self.response = response;

  /* initialize the event emitter */
  emitter = new events.EventEmitter();

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
    emitter.once(eventname, handler);
  }
}
exports.on = subscribe;
