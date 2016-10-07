/**
 * !!! WARNING !!! THIS IS A WORK IN PROGRESS
 *
 * These are methods to load external data files. Since I'm using D3 as a model,
 * these need to return a 'request' if no callback is specified. The returned
 * object should have the following methods: abort(), get([callback]),
 * header(name[, value]), mimeType([value]), 
 * on({beforesend|progress|load|error}[, callback]), 
 * post([data][, callback]), responseType([value]), response([value]), and
 * send([verb][, data][, callback])
 *
 * @author  hrobertking@cathmhaol.com
 *
 * @exports csv as csv
 * @exports dsv as dsv
 * @exports tsv as tsv
 * @exports jso as json
 * @exports txt as text
 */

/**
 * Loads a CSV file
 *
 * @return   {object}
 *
 * @param    {string} path
 * @param    {function} accessor
 * @param    {function} callback
 * @param    {boolean} noheader
 */
function csv(path, accessor, callback, noheader) {
  return loadExternal(path, accessor, callback, noheader, '\\,');
};
exports.csv = csv;

/**
 * Loads a delimited file
 *
 * @return   {void}
 *
 * @param    {string} path
 * @param    {function} accessor
 * @param    {function} callback
 * @param    {boolean} noheader
 * @param    {string} delimiter
 */
function dsv(path, accessor, callback, noheader, delimiter) {
  return loadExternal(path, accessor, callback, noheader, delimiter);
};
exports.dsv = dsv;

/**
 * Loads a TSV file
 *
 * @return   {void}
 *
 * @param    {string} path
 * @param    {function} accessor
 * @param    {function} callback
 * @param    {boolean} noheader
 */
function tsv(path, accessor, callback, noheader) {
  return loadExternal(path, accessor, callback, noheader, '\\t');
};
exports.tsv = tsv;

/**
 * Loads a json file
 *
 * @return   {void}
 *
 * @param    {string} path
 * @param    {function} callback
 */
function jso(path, callback) {
  /* callback is executed with error and data parameters, e.g. callback(error, data) */
  var data, oops;

  function parse(body) {
    try {
      data = JSON.parse(body);
    } catch (err) {
      oops = err;
    } finally {
      if (typeof callback === 'function') {
        callback.call(callback, error, data);
      }
    }
  }

  /* load resource and parse */
  /* on error callback.call(callback, error); */
};
exports.json = jso;

/**
 * Loads a text file
 *
 * @return   {void}
 *
 * @param    {string} path
 * @param    {function} callback
 */
function txt(path, mimetype, callback) {
  /* if typeof mimetype === 'function' && !callback { callback = mimetype; } */
  /* load resource and execute callback */
};
exports.text = txt;

/**
 * Loads a delimited file using the D3js approach
 *
 * @return   {void}
 *
 * @param    {string} path
 * @param    {function} accessor
 * @param    {function} callback
 * @param    {boolean} noheader
 * @param    {string} delimiter
 *
 * @private
 */
function loadExternal(path, accessor, callback, noheader, delimiter) {
  var fs = require('fs')
    , http = require('http')
    , data = [ ]
    , resource = /^https?\:\/\/([^\/]+)(\/.+)?/.exec(path)
  ;

  noheader = (noheader === true);
  delimiter = new RegExp(delimiter);

  /* parse a delimited dataset, assuming each line is a new row */
  function parse(data) {
    var dataset = data.split(/\n/)
      , head = dataset[0].split(delimiter)
      , index
      , pos = noheader ? 0 : 1
    ;

    function obj(cols) {
       var c, o = { };
       for (c = 0; c < head.length; c += 1) {
         o[head[c]] = cols[c];
       }
       return o;
    }

    /* build the dataset */
    for (index = pos; index < d.length; index += 1) {
      data.push( noheader ? 
                 dataset[index].split(delimiter) : 
                 new obj(dataset[index].split(delimiter)) );
    }

    /* use the accessor to set the data if one is specified */
    if (typeof accessor === 'function') {
      for (index = 0; index < data.length; index += 1) {
        data[index] = accessor.call(accessor, data[index]);
      }
    }

    /* use the callback if one is specified */
    if (callback) {
      callback.call(callback, data);
    }
  }

  /* get the file */
  if (resource) {
    /* get the file and parse it in the callback */
    http.get({ host:resource[1], path:resource[2] || '/' }, function(response) {
        var body = '';
        response.on('data', function(chunk) {
            body += chunk;
          });
        response.on('end', function() {
            parse(body);
          });
      }).on('error', function(err) {
           throw err;
         });
  } else {
    /* read the file and parse it in the callback */
    fs.exists(path, function (exists) {
        if (!exists) {
          throw "File not found";
        } else {
          fs.readFile(path, function(err, data) {
              if (err) {
                throw err;
              } else {
                parse(data);
              }
            });
        }
      });
  }
}

/**
 * Returns an object that will get a resource
 */
function Request() {
  /* stop the read and drop the data */
  this.abort = function() {
      if (req.abort) {
        req.abort();
      }
    };

  /* get the data */
  this.get = function(callback) {
      /* if this is an file-system resource, read it, otherwise, get it */
    };

  /* gets/sets headers *
  this.header = function(name, value) {
    };

  /* gets/sets the mime type */
  this.mimeType = function(value) {
    };

  /* event subscriber */
  this.on = function(eventname, callback) {
    /* events allowed: beforesend|progress|load|error */
    };

  /* post the data */
  this.post = function(data, callback) {
      /* if this is a file-system resource, write the data, otherwise, send it */
    };

  /* gets/sets the response type */
  this.responseType = function(value){
    };

  /* gets/sets the response */
  this.response = function(value) {
    };

  /* sends the data */
  this.send = function(verb, data, callback) {
    };

  /**
   * CONSTRUCTOR
   */
  var fs = require('fs')
    , http = require('http')
    , req
  ;

  return this;
}
