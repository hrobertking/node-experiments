/**
 * @author: hrobertking@cathmhoal.com
 *
 * @exports filename as filename
 * @exports writeDataCsv as writeAsCSV
 * @exports writeResponseFile as writeAsFile
 * @exports writeDataHtml as writeAsHTML
 * @exports writeDataJson as writeAsJSON
 * @exports writeDataXml as writeAsXML
 * @exports writeResponseContents as writeContents
 * @exports writeResponseHead as writeContentType
 * @exports writeResponseEmpty as writeEmptyDocument
 * @exports writeResponse404 as writeNotFound
 * @exports writeResponseError as writeServerError
 * @exports writeToFileSystem as writeToFileSystem
 *
 * @see The <a href="https://github.com/hrobertking/node-experiments">node-experiments</a> repo for information about the server module
 */

var fs = require('fs')
  , path = require('path')
  , filename = ''
  , serverMessage
;

/**
 * The default filename to write data to relative to the working directory of the process, e.g., 'sample-splunk-data.json'
 *
 * @type     {string}
 */
Object.defineProperty(exports, 'filename', {
  get: function() {
    return filename;
  },
  set: function(value) {
    if (typeof value === 'string') {
      filename = value;
    }
  }
});

/**
 * Writes the data set out as a CSV and returns the message object
 *
 * @return   {server.Message}
 *
 * @param    {server.Message} message
 * @param    {object[]) data
 */
function writeDataCsv(message, data) {
  var fname = filename.replace(/\.[\w]+$/, '.csv')
    , i           // array loop index
    , key         // hash index
    , keys = []   // a hash of all the keys
    , head = []   // output array
    , lines = []  // output array
    , datum       // an individual data element
    , str = ''    // the content to write out
  ;

  // set a global to make passing data back and forth easier
  serverMessage = message;

  if (message.response) {
    if (data) {
      // Generate a keys object
      for (i in data) {
        line = data[i];
        for (key in line) {
          keys[key] = (typeof line[key]);
        }
      }

      // put the data in a consistent order
      for (key in keys) {
        // There isn't really a good way to represent arrays or objects in a CSV,
        // because the internal representation is going to be comma-separated too,
        // making the header not correspond to the data items, so we're just
        // going to dump out the primitive types.
        if (keys[key] === 'boolean' || keys[key] === 'number' || keys[key] === 'string') {
          head.push(key);
          for (i in data) {
            datum = data[i][key];
            if (!lines[i]) {
              lines[i] = [];
            }
            lines[i].push( datum )
          }
        }
      }

      // write the head (column definition)
      str += head.join(',')+'\n';

      // write the lines
      for (i in lines) {
        str += lines[i].join(',')+'\n';
      }

      writeResponseHead(message.response, 'csv', str.length)
      message.response.write(str);

      writeToFileSystem(str, fname);
    }
  }

  serverMessage.response.bytes = Buffer.byteLength(str.toString());
  serverMessage.response.date = new Date();
  return serverMessage;
}
exports.writeAsCSV = writeDataCsv;

/**
 * Writes the data set out as HTML and returns the message object
 *
 * @return   {server.Message}
 *
 * @param    {server.Message} message
 * @param    {object[]) data
 */
function writeDataHtml(message, data) {
  var fname = filename.replace(/\.[\w]+$/, '.html')
    , i           // array loop index
    , line        // line out
    , item        // data item
    , key         // item key index
    , str = ''    // the content to write out
  ;

  // set a global to make passing data back and forth easier
  serverMessage = message;

  if (message.response) {
    if (data) {
      str += '<!DOCTYPE html>\n';
      str += '<body>\n';
      str += '<ul>\n';
      for (i in data) {
        item = data[i];
        line = [];
        for (key in item) {
          line.push('data-' + key + '="' + item[key] + '"');
        }
        str += '\t<li ' + line.join(' ') + '>' + i + '</li>\n';
      }
      str += '</ul>\n';
      str += '</body>\n';
      str += '</html>\n';

      writeResponseHead(message.response, 'html', str.length)
      message.response.write(str);

      writeToFileSystem(str, fname);
    }
  }

  serverMessage.response.bytes = Buffer.byteLength(str.toString());
  serverMessage.response.date = new Date();
  return serverMessage;
}
exports.writeAsHTML = writeDataHtml;

/**
 * Writes the data set out as JSON encoded and returns the message object
 *
 * @return   {server.Message}
 *
 * @param    {server.Message} message
 * @param    {object[]) data
 */
function writeDataJson(message, data) {
  var fname = filename.replace(/\.[\w]+$/, '.json')
    , i          // array loop index
    , str = [ ]  // the content to write out
  ;

  // set a global to make passing data back and forth easier
  serverMessage = message;

  if (message.response) {
    if (data) {
      for (i in data) {
        str.push(JSON.stringify(data[i], null, '\t'));
      }

      str = '[\n' + str.join(',\n') + ']\n';

      writeResponseHead(message.response, 'json', str.length)
      message.response.write(str);

      writeToFileSystem(str, fname);
    }
  }

  serverMessage.response.bytes = Buffer.byteLength(str.toString());
  serverMessage.response.date = new Date();
  return serverMessage;
}
exports.writeAsJSON = writeDataJson;

/**
 * Writes the data set out as an XML document and returns the message object
 *
 * @return   {server.Message}
 *
 * @param    {server.Message} message
 * @param    {object[]) data
 * @param    {string} tagNameRoot
 * @param    {string} tagNameChild
 */
function writeDataXml(message, data, tagNameRoot, tagNameChild) {
  var fname = filename.replace(/\.[\w]+$/, '.xml')
    , attr = [ ]  // attributes
    , i           // array loop index
    , item        // data item
    , key         // item key index
    , line        // line out
    , schema = '' // xml-schema
    , str = ''    // the content to write out
  ;

  // set a global to make passing data back and forth easier
  serverMessage = message;

  tagNameRoot = tagNameRoot || 'root';
  tagNameChild = tagNameChild || 'child';

  if (message.response) {
    if (data) {
      str += '<?xml version="1.0" encoding="UTF-8"?>\n';
      str += '<' + tagNameRoot + '>\n';
      for (i in data) {
        item = data[i];
        line = [];
        for (key in item) {
          line.push(key + '="' + item[key] + '"');
          switch (typeof item[key]) {
            case 'boolean':
              attr[key] = 'xs:boolean';
              break;
            case 'number':
              attr[key] = Math.floor(item[key]) == item[key] ? 'xs:integer' : 'xs:decimal'; // use == because we must only check the value
              break;
            case 'string':
              attr[key] = 'xs:string';
              break;
            default:
              attr[key] = item[key] instanceof Date ? 'xs:dateTime' : 'xs:string';
              break;
          }
        }
        str += '\t<' + tagNameChild + line.join(' ') + '/>\n';
      }
      str += '</' + tagNameRoot + '>\n';

      // create the schema
      schema += '<?xml version="1.0"?>\n';
      schema += '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">\n';
      schema += '<xs:element name="' + tagNameRoot +'">\n';
      schema += '\t<xs:complexType>\n';
      schema += '\t\t<xs:sequence>\n';
      schema += '\t\t\t<xs:element name="' + tagRootChild + '">\n';
      schema += '\t\t\t\t<xs:complexType>\n';
      for (key in attr) {
        schema += '\t\t\t\t\t<xs:attribute name="' + key +'" type="' + attr[key] + '"/>\n';
      }
      schema += '\t\t\t\t</xs:complexType>\n';
      schema += '\t\t\t</xs:element>\n';
      schema += '\t\t</xs:sequence>\n';
      schema += '\t</xs:complexType>\n';
      schema += '</xs:element>\n';
      schema += '</xs:schema>\n';

      writeResponseHead(message.response, 'xml', str.length)
      message.response.write(str);

      writeToFileSystem(str, fname);
    }
  }

  serverMessage.response.bytes = Buffer.byteLength(str.toString());
  serverMessage.response.date = new Date();
  return serverMessage;
}
exports.writeAsXML = writeDataXml;

/**
 * Writes the contents directly to the stream and returns the message object
 *
 * @return   {server.Message}
 *
 * @param    {server.Message} message
 * @param    {string} data
 */
function writeResponseContents(message, data) {
  var str = '';

  // set a global to make passing data back and forth easier
  serverMessage = message;

  if (message.response) {
    if (data) {
      str += contents.toString('utf8');
    }
    message.response.write(str);
  }
  serverMessage.response.bytes = Buffer.byteLength(str);
  serverMessage.response.date = new Date();
  return serverMessage;
}
exports.writeContents = writeResponseContents;

/**
 * Writes a 404 response error and returns the message object
 *
 * @return   {server.Message}
 *
 * @param    {server.Message} message
 */
function writeResponse404(message) {
  var str = '';

  // set a global to make passing data back and forth easier
  serverMessage = message;

  if (message.response) {
    str += '<!DOCTYPE html>';
    str += '\t<head><title>404 - Not Found</title></head>\n';
    str += '\t<body><h1>404 - Not Found</h1><p>I am sorry, but the resource you requested does not exist in this dimension.</p></body>\n';
    str += '</html>\n';

    message.response.writeHead(404, {'Content-Type': 'text/html', 'Content-length': str.length});
    message.response.write(str);
  }

  serverMessage.response.bytes = Buffer.byteLength(str.toString());
  serverMessage.response.date = new Date();
  return serverMessage;
}
exports.writeNotFound = writeResponse404;

/**
 * Writes an empty document
 *
 * @return   {server.Message}
 *
 * @param    {server.Message} message
 */
function writeResponseEmpty(message) {
  // set a global to make passing data back and forth easier
  serverMessage = message;

  if (message.response) {
    writeResponseHead(message.response, 'html', 0);
  }

  serverMessage.response.bytes = 0;
  serverMessage.response.date = new Date();
  return serverMessage;
}
exports.writeEmptyDocument = writeResponseEmpty;

/**
 * Writes an error to the response and returns the message object
 *
 * @return   {server.Message}
 *
 * @param    {server.Message} message
 * @param    {string} err
 */
function writeResponseError(message, err) {
  var str = '';

  // set a global to make passing data back and forth easier
  serverMessage = message;

  if (message.response) {
    str = (err || 'Ouch. A server error has occurred') + '\n';

    message.response.writeHead(500, {'Content-Type': 'text/plain', 'Content-length': str.length});
    message.response.write(str);
  }

  serverMessage.response.bytes = Buffer.byteLength(contents.toString());
  serverMessage.response.date = new Date();
  return serverMessage;
}
exports.writeServerError = writeResponseError;

/**
 * Writes a file to the response and returns the message object
 *
 * @return   {server.Message}
 *
 * @param    {server.Message} message
 * @param    {string} data
 */
function writeResponseFile(message, data) {
  var str = '';

  // set a global to make passing data back and forth easier
  serverMessage = message;

  if (message.response) {
    if (data) {
      str += data.toString('binary');

      message.response.writeHead(200);
      message.response.write(str);
    }
  }

  serverMessage.response.bytes = Buffer.byteLength(str);
  serverMessage.response.date = new Date();
  return serverMessage;
}
exports.writeAsFile = writeResponseFile;

/**
 * Writes the response headers
 *
 * @return   {void}
 *
 * @param    {HTTPResponse} response
 * @param    {string} type
 * @param    {number} length
 */
function writeResponseHead(response, type, length) {
  if (response) {
    switch (type.toLowerCase()) {
      case 'csv':
        response.writeHead(200, {'Access-Control-Allow-Origin':'*', 'Content-Type': 'text/plain', 'Content-length': length});
        break;
      case 'json':
        response.writeHead(200, {'Access-Control-Allow-Origin':'*', 'Content-Type': 'application/json', 'Content-length': length});
        break;
      case 'xml':
        response.writeHead(200, {'Access-Control-Allow-Origin':'*', 'Content-Type': 'application/xml', 'Content-length': length});
        break;
      default:
        response.writeHead(200, {'Access-Control-Allow-Origin':'*', 'Content-Type': 'text/html', 'Content-length': length});
        break;
    }
  }
}
exports.writeContentType = writeResponseHead;

/**
 * Writes to the file system
 *
 * @return   {void}
 *
 * @param    {string} contents
 * @param    {string} fname
 */
function writeToFileSystem(contents, fname) {
  fname = path.join(process.cwd(), fname);
  fs.writeFile(fname, contents, function (err) {
    if (err) {
      console.warn(err);
    }
  });
}
exports.writeToFileSystem = writeToFileSystem;
