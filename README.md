node-experiments
================

# Experiments in nodejs

## What is this?

**Experiments in nodejs** is, simply, a collection of experiments I've undertaken using nodejs. Some are simple
learning experiments and some are code that has gone on to some sort of production environment - though there
may have been some changes not included in this repository.

Each experiment is documented as much as possible. Please feel free to run the code though any move towards
running an experiment in a production environment should be thoroughly tested and hardened to make it as
fault tolerant as possible.

All of the comments are intact so other engineers can easily see what I'm doing, how I'm doing it, and
*most importantly*, why I'm doing it.

## Weapons in the arsenal

Not all experiments are listed here, so your choice of weapons is somewhat limited. Feel free to ping me
if you believe, based on what you've seen here, I may have something in the works or an update to one
of the experiments.

### curl
A handy little module that will run curl in much the same way the http.request works. There are some
minor differences because of the difference in use-cases.

*object* curl.request([*object|string* options[, *function* callback]);

Example:  
var curl = require('./curl'),  
 req = curl.request({ 'host':'js.cathmhaol.com', 'protocol':'http' }, responseHandler);

*Methods*
- *void* abort: Aborts the request
- *void* end: Ends the request
- *void* on(*string* eventname, *function* callback): Listens for the event and executes the callback when the event fires
- *void* setNoDelay([boolean]): Eliminates the TCP delay that is normally present, or reinstates it if false is passed.
- *void* setSocketKeepAlive(*boolean* enable, *integer* delay): Sets the connection to keep-alive after a specific delay.
- *void* setTimeout(*integer* ms[, *function* callback): Sets the amount of time before timing out and optionally the callback to execute when the timeout event fires.
- *void* write(*string* data[, *string* encoding): Writes data to the connection to be posted, with optional encoding (binary is currently the only supported encoding).

*Events*
- error: Fired when the curl process returns an error
- response: Fired when the response is received
- timeout: Fired when a timeout event occurs. If timeout has not been set or is set to 0, a timeout never occurs.

### router
The routing module used with the *server* and *writer* modules

Example:  
var router = require('./router');
router.route(request, response);

*Methods*
- *void* route(*stream* request, *stream* response)

### server
The primary module that generates a web server. It requires the *router* module and the *writer* module in this repo.

Example:  
var server = require('./server');
server.port = 8080;
server.start();

*Methods*
- *void* start: Starts the web server

*Properties*
- *integer* port: The port to listen on.

### writer
A collection of methods used to write to the response stream on the web server.

Example:  
var writer = require('./writer');
writer.writeAsJSON(res, [ {'name':'foo', 'value':'1'}, {'name':'bar', 'value':'2'} ]);

*Methods*
- *void* writeAsCSV(*stream* response, *object[]* data): Writes the data collection out as comma-separated values with a data element name header row.
- *void* writeAsFile(*stream* response, *stream* file): Writes the file to the response.
- *void* writeAsHTML(*stream* response, *object[]* data): Writes the data collection out as an HTML response using an unordered list
- *void* writeAsJSON(*stream* response, *object[]* data): Writes the data collection out in JSON format.
- *void* writeAsXML(*stream* response, *object[]* data): Writes the data collection out as XML, using 'data' as the root element and items in 'item' elements.
- *void* writeClose(*stream* response): Closes the stream.
- *void* writeContentType(*stream* response, *string* type, *integer* length): Writes the content-type and content-length headers. The default type is text/html; other recognized types and their corresponding content-type are:
* csv - text/plain;
* json - application/json
* xml - application/xml
- *void* writeNotFound(*stream* response): Writes a generic 404 page.
- *void* writeServerError(*stream* response, *string* err): Writes the specified error to an text/html response using 500 as the status code.

## Licensing

Who are we kidding here? If I tried to provide a license other than *do whatever you want* what would be the point? Seriously. The only thing you *can't* do is contribute back to this repo. ***I am the Cathmhaol*. *There can be only one*.**
