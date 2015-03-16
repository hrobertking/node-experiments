/**
 * author: hrobertking@cathmhoal.com
 *
 * @exports parse as parse
 */

/**
 * Parses the array of arguments passed and returns an object
 * @return   {object}
 * @param    {string[]} args
 * @example  node index.js --port 9090 -u hrobertking --password foobar -> cli.parse(process.argv.slice(2)) -> { 'password':'foobar', 'port':'9090', 'u':'hrobertking' }
 */
function parse(args) {
  var obj = { argv:args }
    , arg_l
    , arg_s
    , values
  ;

  // If the first two args are the script call, drop them
  if (args[0] === 'node' && args[1].indexOf('.js')) {
    obj._command = args[1];
    args.splice(0, 2);
    obj.argv = args;
  }

  // Loop through all the options args
  while (args.length) {
    arg_l = /^\-{2}(\S+)/.exec(args[0]);  // long arg format
    arg_s = /^\-{1}(\S+)/.exec(args[0]);  // short arg format
    if (arg_l) {
      if (!/^\-{2}(\S+)/.test(args[1])) {
        // there is data passed in, so get the current value for the arg and 
        // add this value to it, then store the values in the property of the
        // object, but assume it's a flag if the value is empty
        values = (obj[arg_l[1]] || '').split(',');
        values.push(args[1]);
        obj[arg_l[1]] = values.join(',').replace(/^\,/, '').replace(/\,$/, '');
        obj[arg_l[1]] = obj[arg_l[1]].length ? obj[arg_l[1]] : true;
        args.splice(0, 2);
      } else {
        // there isn't data passed in, so set the flag to true
        obj[arg_l[1]] = true;
        args.splice(0, 1);
      }
    } else if (arg_s) {
      // split the 'small' arg name into letters, then loop through the letters
      // and set each to true
      arg_s = arg_s[1].split('');
      for (values = 0; values < arg_s.length; values += 1) {
        obj[arg_s[values]] = true;
      }
      args.splice(0, 1);
    } else {
      // get the current value for the unnamed arguments and add this value to
      // it, then store the values in the property of the object
      values = (obj._unnamed || '').split(',');
      values.push(args[0]);
      obj._unnamed = values.join(',').replace(/^\,/, '').replace(/\,$/, '');
      args.splice(0, 1);
    }
  }

  return obj;
}
exports.parse = parse;
