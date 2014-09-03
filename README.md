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

### cli-opts
A handy little utility to parse command-line options

Example:  
var cli = require('./cli-opts'),  
 opts = cli.parse(process.argv.slice(2));  
if (opts.h || opts.help) {  
  //show help  
}  

*Methods*
- *object* parse: Returns an object with named parameters and a copy of all parameters in argv.

### router
The routing module used with the *server* and *writer* modules

Example:  
var router = require('./router');
router.route(request, response);

*Methods*
- *void* on(*string* eventname, *function* handler): Subscribes to the 'error' or 'response-sent' event
- *void* route(*server.Message* message): Routes a request

*Properties*
- *hash* routes: A hash of routes and their defined handlers

Example:  
var router = require('./route'),  
server = require('./server'),  
message = new Message(request, response);  
router.route(message);

### scale
A module to calculate a scale for a value given a domain (minimum and maximum possible data values) and a range (minimum and maximum mapped values).

Example:  
var scale = require('./scale');  
scale.domain = [1, 10];  
scale.range = [1, 100];  
var mapped = scale.scale(5);  // returns 50

### server
The primary module that generates a web server. It requires the *router* module and the *writer* module in this repo.

Example:  
var server = require('./server');  
server.port = 8080;  
server.start();

*Methods*
- *void* on(*string* eventname, *function* handler): Subscribes to the 'request-received' or 'response-sent' event
- *void* start(*integer* listento): Starts the web server on the port specified

*Properties*
- *integer* port: The port to listen on.

### writer
A collection of methods used to write to the response stream on the web server.

Example:  
var writer = require('./writer');  
writer.writeAsJSON(res, [ {'name':'foo', 'value':'1'}, {'name':'bar', 'value':'2'} ]);

*Methods*
- *server.Message* writeAsCSV(*server.Message* message, *object[]* data): Writes the data collection out as comma-separated values with a data element name header row.
- *server.Message* writeAsFile(*server.Message* message, *stream* file): Writes the file to the message.
- *server.Message* writeAsHTML(*server.Message* message, *object[]* data): Writes the data collection out as an HTML response using an unordered list
- *server.Message* writeAsJSON(*server.Message* message, *object[]* data): Writes the data collection out in JSON format.
- *server.Message* writeAsXML(*server.Message* message, *object[]* data[, *string* tagNameRoot[, *string* tagNameChild]]): Writes the data collection out as XML, using 'data' as the root element and items in 'item' elements.
- *server.Message* writeContents(*server.Message* message, *string* data): Writes the data to the response stream
- *void* writeContentType(*stream* message, *string* type, *integer* length): Writes the content-type and content-length headers. The default type is text/html; other recognized types and their corresponding content-type are:
* csv - text/plain;
* json - application/json
* xml - application/xml
- *server.Message* writeEmptyDocument(*server.Message* message): Writes an empty document to the response stream
- *server.Message* writeNotFound(*server.Message* message): Writes a generic 404 page.
- *server.Message* writeServerError(*server.Message* message, *string* err): Writes the specified error to an text/html response using 500 as the status code.
- *void* writeToFileSystem(*string* contents, *string* filename): Writes the contents to the specified filename

## Licensing

Who are we kidding here? If I tried to provide a license other than *do whatever you want* what would be the point? Seriously. The only thing you *can't* do is contribute back to this repo. ***I am the Cathmhaol*. *There can be only one*.**
