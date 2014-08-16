/**
 * @author: hrobertking@cathmhoal.com
 *
 * exports.writeAsCSV = writeResponseCSV;
 * exports.writeAsFile = writeResponseFile;
 * exports.writeAsHTML = writeResponseHTML;
 * exports.writeAsJSON = writeResponseJSON;
 * exports.writeAsXML = writeResponseXML;
 * exports.writeClose = writeResponseClose;
 * exports.writeContentType = writeResponseHead;
 * exports.writeNotFound = writeResponse404;
 * exports.writeServerError = writeResponseError;
 *
 */

/**
 * Writes a 404 response error
 * @return      {void}
 * @param       {HTTPResponse} response
 */
function writeResponse404(response) {
	if (response) {
		var msg = '<!DOCTYPE html>';
		msg += '\t<head><title>404 - Not Found</title></head>\n';
		msg += '\t<body><h1>404 - Not Found</h1><p>I am sorry, but the resource you requested does not exist in this dimension.</p></body>\n';
		msg += '</html>\n';

		response.writeHead(404, {'Content-Type': 'text/html', 'Content-length': msg.length});
		response.write(msg);

		response.end();
	}
}
exports.writeNotFound = writeResponse404;

/**
 * Writes the data set out as a CSV
 * @return	{void}
 * @param	{HTTPResponse} response
 * @param	{object[]) data
 */
function writeResponseCSV(response, data) {
	if (response) {
		var i           // array loop index
		  , key         // hash index
		  , keys = []   // a hash of all the keys
		  , head = []   // output array
		  , lines = []  // output array
		  , datum       // an individual data element
		  , str = ''    // the content to write out
		;

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

			writeResponseHead(response, 'csv', Buffer.byteLength(str))
			response.write(str);
			writeResponseClose(response);
		}
	}
}
exports.writeAsCSV = writeResponseCSV;

/**
 * Writes the data set out as HTML
 * @return	{void}
 * @param	{HTTPResponse} response
 * @param	{object[]) data
 */
function writeResponseHTML(response, data) {
	if (response) {
		var i     // array loop index
		  , line  // line out
		  , item  // data item
		  , key   // item key index
		  , str = ''    // the content to write out
		;

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

		writeResponseHead(response, 'html', Buffer.byteLength(str))
		response.write(str);
		writeResponseClose(response);
	}
}
exports.writeAsHTML = writeResponseHTML;

/**
 * Writes the data set out as JSON encoded
 * @return	{void}
 * @param	{HTTPResponse} response
 * @param	{object[]) data
 */
function writeResponseJSON(response, data) {
	if (response) {
		var i         // array loop index
		  , str = ''  // the content to write out
		;

		if (data) {
			str += '[\n';
			for (i in data) {
				str += JSON.stringify(data[i], null, '\t') + '\n';
			}
			str += ']\n';
		}

		writeResponseHead(response, 'json', Buffer.byteLength(str))
		response.write(str);
		writeResponseClose(response);
	}
}
exports.writeAsJSON = writeResponseJSON;

/**
 * Writes the data set out as an XML document
 * @return	{void}
 * @param	{HTTPResponse} response
 * @param	{object[]) data
 */
function writeResponseXML(response, data) {
	if (response) {
		var i         // array loop index
		  , line      // line out
		  , item      // data item
		  , key       // item key index
		  , str = ''  // the content to write out
		;

		str += '<?xml version="1.0" encoding="UTF-8"?>\n';
		str += '<data>\n';
		for (i in data) {
			item = data[i];
			line = [];
			for (key in item) {
				line.push(key + '="' + item[key] + '"');
			}
			str += '\t<item ' + line.join(' ') + '/>\n';
		}
		str += '</data>\n';

		writeResponseHead(response, 'xml', Buffer.byteLength(str))
		response.write(str);
		writeResponseClose(response);
	}
}
exports.writeAsXML = writeResponseXML;

/**
 * Writes the response headers
 * @return	{void}
 * @param	{HTTPResponse} response
 * @param	{string} type
 * @param	{integer} length
 */
function writeResponseHead(response, type, length) {
	if (response) {
		switch (type.toLowerCase()) {
			case 'csv':
				response.writeHead(200, {'Content-Type': 'text/plain', 'Content-length': length});
				break;
			case 'json':
				response.writeHead(200, {'Content-Type': 'application/json', 'Content-length': length});
				break;
			case 'xml':
				response.writeHead(200, {'Content-Type': 'application/xml', 'Content-length': length});
				break;
			default:
				response.writeHead(200, {'Content-Type': 'text/html', 'Content-length': length});
				break;
		}
	}
}
exports.writeContentType = writeResponseHead;

/**
 * Closes the response
 * @return	{void}
 * @param	{HTTPResponse} response
 */
function writeResponseClose(response) {
	if (response) {
		response.end();
	}
}
exports.writeClose = writeResponseClose;

/**
 * Writes an error to the response
 * @return	{object}
 * @param	{HTTPResponse} response
 * @param	{string} err
 */
function writeResponseError(response, err) {
	if (response) {
		var msg = err + '\n';

		response.writeHead(500, {'Content-Type': 'text/plain', 'Content-length': msg.length});
		response.write(msg);
		response.end();
	}
}
exports.writeServerError = writeResponseError;

/**
 * Writes a file to the response
 * @return	{object}
 * @param	{HTTPResponse} response
 * @param	{string} file
 */
function writeResponseFile(response, file) {
	if (response) {
		response.writeHead(200);
		response.write(file, 'binary');
		response.end();
	}
}
exports.writeAsFile = writeResponseFile;
