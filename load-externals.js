/**
 * These are methods to load external data files. I'm using D3 as a model.
 *
 * @author  hrobertking@cathmhaol.com
 *
 * @exports csv as csv
 * @exports dsv as dsv
 * @exports tsv as tsv
 */

/**
 * Loads a CSV file
 * @return   {object}
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
 * @return   {void}
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
 * @return   {void}
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
 * Loads a delimited file using the D3js approach
 * @return   {void}
 * @param    {string} path
 * @param    {function} accessor
 * @param    {function} callback
 * @param    {boolean} noheader
 * @param    {string} delimiter
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

  // parse a delimited dataset, assuming each line is a new row
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

    // build the dataset
    for (index = pos; index < d.length; index += 1) {
      data.push( noheader ? 
                 dataset[index].split(delimiter) : 
                 new obj(dataset[index].split(delimiter)) );
    }

    // use the accessor to set the data if one is specified
    if (typeof accessor === 'function') {
      for (index = 0; index < data.length; index += 1) {
        data[index] = accessor.call(accessor, data[index]);
      }
    }

    // use the callback if one is specified
    if (callback) {
      callback.call(callback, data);
    }
  }

  // get the file
  if (resource) {
    // get the file and parse it in the callback
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
    // read the file and parse it in the callback
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
