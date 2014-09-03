/**
 * author: hrobertking@cathmhoal.com
 *
 * @exports parse as parse
 *
 */

/**
 * Parses the array of arguments passed and returns an object
 * @return	{object}
 * @param	{string[]} args
 * @example	node index.js --port 9090 -u hrobertking --password foobar -> cli.parse(process.argv.slice(2)) -> { 'password':'foobar', 'port':'9090', 'u':'hrobertking' }
 */
function parse(args) {
	var opts = { argv:args }
	  , named = /^\-{1,2}([^\s]+)/
	  , parm
	  , values
	;

	while (args.length) {
		parm = named.exec(args[0]);
		if (parm) {
			if (!named.test(args[1])) {
				// there is data passed in
				values = (opts[parm[1]] || '').split(',');                               // get the current value for the arg
				values.push(args[1]);                                                    // add this value to it
				opts[parm[1]] = values.join(',').replace(/^\,/, '').replace(/\,$/, '');  // store the values in the property of the object
				args.splice(0, 2);                                                       // delete both processed args from the array
			} else {
				// there isn't data passed in
				opts[parm[1]] = true;
				args.splice(0, 1);
			}
		} else {
			opts[args[0]] = args[0];
			args.splice(0, 1);
		}
	}

	return opts;
}
exports.parse = parse;
