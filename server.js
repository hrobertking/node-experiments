/**
 * @author: hrobertking@cathmhoal.com
 *
 * exports.port = port;
 * exports.start = start;
 *
 */

var http = require('http')
  , qs = require('querystring')
  , router = require('./router')
  , port
;

Object.defineProperty(exports, 'port', {
	get: function() {
		return port;
	},
	set: function(value) {
		if (!isNaN(value)) {
			port = value;
		}
	}
});

function sleep(ms) {
	var end = (new Date()).getTime() + ms
	  , tick = 0
	;
	while ((new Date()).getTime() < end) {
		tick += 1;
	}
	return;
}

function start() {
	function onRequest(request, response) {
		var ms                                             // time onRequest was called
		  , posted = ''                                    // data posted
		  , latency = 0
		;

		ms = (new Date()).getTime();

		// configure request
		request.setEncoding('utf8');
		request.on('data', function(chunk) {
			posted += chunk;
		});

		// set up the event handlers on the response
		response.on('finish', function() {
			var elapsed = (new Date()).getTime() - ms;

			console.log(request.url + '\t' + 
						this.statusCode + '\t' + 
						elapsed + 'ms' + '\t' +
						(new Date()).toISOString()
				);
		});

		latency = qs.parse(posted).latency;
		if (latency > 0) {
			sleep(latency);
		}

		// route the request
		router.route(request, response);
	}

	http.createServer(onRequest).listen(port);
	console.log('');
	console.log('Server has started on ' + port);
}
exports.start = start;
