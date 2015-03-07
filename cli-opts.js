/**
 * author: hrobertking@cathmhoal.com
 *
 * @exports parse as parse
 *
 */

/**
 * Parses the array of arguments passed and returns an object
 * @return   {object}
 * @param    {string[]} args
 * @example  node index.js --port 9090 -u hrobertking --password foobar -> cli.parse(process.argv.slice(2)) -> { 'password':'foobar', 'port':'9090', 'u':'hrobertking' }
 */
function parse(args) {
  var opts = { argv:args }
    , named = /^\-{1,2}(\S+)/
    , parm
    , values
  ;

  // If the first two args are the script call, drop them
  if (args[0] === 'node' && args[1].indexOf('.js')) {
    opts._command = args[1];
    args.splice(0, 2);
    opts.argv = args;
  }

  // Loop through all the options args
  while (args.length) {
    parm = named.exec(args[0]);
    if (parm) {
      if (!named.test(args[1])) {
        // there is data passed in
        values = (opts[parm[1]] || '').split(',');                               // get the current value for the arg
        values.push(args[1]);                                                    // add this value to it
        opts[parm[1]] = values.join(',').replace(/^\,/, '').replace(/\,$/, '');  // store the values in the property of the object
        opts[parm[1]] = opts[parm[1]] || true;                                   // assume if the value is blank, this is a flag and set it to true
        args.splice(0, 2);                                                       // delete both processed args from the array
      } else {
        // there isn't data passed in
        opts[parm[1]] = true;
        args.splice(0, 1);
      }
    } else {
      values = (opts._unnamed || '').split(',');                                 // get the current value for the unnamed arguments
      values.push(args[0]);                                                      // add this value to it
      opts._unnamed = values.join(',').replace(/^\,/, '').replace(/\,$/, '');    // store the values in the property of the object
      args.splice(0, 1);                                                         // delete teh processed arg from the array
    }
  }

  return opts;
}
exports.parse = parse;
