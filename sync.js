/**
 * @author: hrobertking@cathmhaol.com
 *
 * @exports cmdSync as cmd
 *
 */
 
/**
 * Runs a child process synchronously and returns the output from the command as a string
 * @return   {string}
 * @param    {string} command
 */
function cmdSync(command) {
  var child_process = require('child_process')
    , fs = require('fs')
    , dt = (new Date()).getTime()
    , output
    , spawned = 'childprc.' + dt
  ;

  // execute the command and redirect output to controlled names
  child_process.exec(command + ' &>' + spawned + '.out && echo done! > ' + spawned + '.done');

  // loop to check the file system for the 'done' indicator
  while (!fs.existsSync(spawned + '.done')) {
    // wait for the file till it's there
  }

  // once the 'done' indicator appears, get the output of the command
  output = fs.readFileSync(spawned + '.out');

  // delete the 'done' indicator and the output
  fs.unlinkSync(spawned + '.out');
  fs.unlinkSync(spawned + '.done');

  return output;
}
exports.cmd = cmdSync;
