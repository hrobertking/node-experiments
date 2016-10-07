/**
 * @author  hrobertking@cathmhaol.com
 *
 * @exports analyze as analyze
 * @exports dataset as data
 * @exports log_file as file
 * @exports readFile as read
 * @exports subscribe as on
 *
 * @emits   attack
 */

var events = require('events')           /* Nodejs core */
  , fs = require('fs')                   /* Nodejs core */
  , emitter                              /* Nodejs EventEmitter */
  , emitted = [ 'file-close-error'       /* Error thrown when file close fails */
              , 'file-not-found'         /* Error thrown when file is not found */
              , 'file-open-error'        /* Error thrown when file open fails */
              , 'file-output-error'      /* Error thrown when file write fails */
              , 'file-read-error'        /* Error thrown when file read fails */
              , 'read-complete']         /* Fired when the file read is complete */
  , opts = require('./cli-opts')         /* Command-line interface */
  , cli_args = opts.args                 /* Command-line arguments */
  , dataset = [ ]                        /* Array of all entries */
  , log_file                             /* Absolute path to the log data */
;

/**
 * The log entries
 *
 * @type     {object[]}
 */
Object.defineProperty(exports, 'data', {
  get: function() {
    return dataset;
  },
  set: function(value) {
    /* READ-ONLY */
  }
});

/**
 * The file to be analyzed
 *
 * @type     {string}
 */
Object.defineProperty(exports, 'file', {
  get: function() {
    return log_file;
  },
  set: function(value) {
    __setLogFile(value);
  }
});

/**
 * Analyzes the dataset to determine if an attack is in process
 *
 * @return  {boolean}
 */
function analyze() {
  var dashboard = { users:[ ], pages:[ ] }
    , index = dataset.length - 1
    , entry
    , prop
  ;

  /* count hits */
  while (index > -1) {
    entry = dataset[index];
    dashboard.users[entry['client']] = (dashboard.users[entry['client']] ?
                                        dashboard.users[entry['client']] :
                                        0) + 1;
    dashboard.pages[entry['header'].path] = (dashboard.pages[entry['header'].path] ?
                                        dashboard.pages[entry['header'].path] :
                                        0) + 1;
    index -= 1;
  }

  /* output hits */
  for (index in dashboard) {
    for (prop in dashboard[index]) {
      if (dashboard[index].hasOwnProperty(prop)) {
        console.log('dashboard["' + index + '"]["' + prop + '"] = ' + dashboard[index][prop]);
      }
    }
  }
}
exports.analyze = analyze;

/**
 * A log entry
 */
function Entry(line) {
  var data = line.split('\t');

  function parseValue(value) {
    var date_format = /\[(\d{1,})\/(\w+)\/(\d{4})\:(\d+)\:(\d+)\:(\d+) ([\-\+]?\d+)\]/
      , header_format = /(\w+) (\/[^\s]*) HTTP\/([\d\.]*)/
      , months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      , is_date = date_format.exec(value)
      , is_header = header_format.exec(value)
    ;

    value = (value || '').replace(/\"/g, '');

    if (value === '-') {
      value = null;
    } else if (is_header) {
      value = { verb: is_header[1]
              , path: is_header[2]
              , httpVersion: is_header[3] };
    } else if (is_date) {
      value = new Date( is_date[3]
                      , months.indexOf(is_date[2])
                      , is_date[1]
                      , is_date[4]
                      , is_date[5]
                      , is_date[6]);
    }
    return value;
  }

  this['server'] = parseValue(data[0]);
  this['client'] = parseValue(data[1]);
  this['logname'] = parseValue(data[2]);
  this['username'] = parseValue(data[3]);
  this['requested'] = parseValue(data[4]);
  this['header'] = parseValue(data[5]);
  this['status'] = parseValue(data[6]);
  this['bytes'] = parseValue(data[7]);
  this['referer'] = parseValue(data[8]);
  this['user-agent'] = parseValue(data[9]);
  this['time-taken'] = parseValue(data[10]);

  return this;
}

/**
 * Reads the file into the dataset
 *
 * @return  {void}
 *
 * @emits   file-read-error
 * @emits   read-complete
 */
function readFile() {
  var rstream    /* read stream */
    , data = ''  /* data read from stream */
  ;

  /* Register the read-complete handler */
  emitter.removeListener('read-complete', analyze);
  emitter.once('read-complete', analyze);

  /* Get a handle to the stream */
  rstream = fs.createReadStream(log_file);

  /* Handle reads */
  rstream.on('data', function(chunk) {
    data += chunk;
  });

  /* Handle errors */
  rstream.on('error', function() {
    __err('file-read-error');
  });

  /* Parse it once it's been read. Assume the log format is
   * NCSA extended with virtual host as the first field and
   * time-taken as the last field and fields are
   * tab-delimited. Empty values are denoted by a hyphen.
   *
   * s-ip:s-port, c-ip, cs-logname, cs-username, date, request,
   * sc-status, sc-bytes, cs-referer, cs-user-agent, time-taken
   */
  rstream.on('end', function() {
    var lines = data.split('\n')
      , index = lines.length - 1
      , entry
    ;

    try {
      if (index > -1) {
        dataset = [ ];
        while (index > -1) {
          entry = new Entry(lines[index]);

          if (entry['client'] && entry['status']) {
            dataset.push(new Entry(lines[index]));
          }

          index -= 1;
        }
        emitter.emit('read-complete');
      }
    } catch(oops) {
      __err('file-read-error');
    }
  });
}
exports.read = readFile;

/**
 * Registers event handlers for emitted events
 *
 * @return  {void}
 *
 * @param   {string} eventname
 * @param   {function} handler
 */
function subscribe(eventname, handler) {
  if (emitted.indexOf(eventname) > -1) {
    emitter.removeListener(eventname, handler);
    emitter.on(eventname, handler);
  }
}
exports.on = subscribe;

/**
 * Emits an error and dumps it to the console as well
 *
 * @return  {void}
 *
 * @param   {string} name
 * @param   {object} arg
 */
function __err(name, arg) {
  console.log('Error: ' + name + (arg ? '\n\t-->' + JSON.stringify(arg) : ''));
  emitter.emit(name, arg);
}

/**
 * Sets the log file
 *
 * @return  {void}
 *
 * @param   {string} value
 *
 * @emits   'file-not-found'
 */
function __setLogFile(value) {
  if (typeof value === 'string' && value !== '') {
    fs.exists(value, (exists) => {
      if (exists) {
        log_file = value;
        readFile();
      } else {
        __err('file-not-found');
      }
    });
  }
}

/**
 * Start up
 */
function __startup(file) {
  emitter = new events.EventEmitter();
  if (file) {
    __setLogFile(file);
  }
}

__startup(cli_args.file || (cli_args.argv.length > 2 ? cli_args.argv.pop() : null));
