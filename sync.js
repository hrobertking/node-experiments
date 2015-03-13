/**
 * @author: hrobertking@cathmhaol.com
 *
 * @exports cmdSync as cmd
 */
 
/**
 * Runs a process synchronously, returning the output from the command
 * @return   {string}
 * @param    {string} cmd
 */
function __cmdSync(cmd) {
  var child_process = require('child_process')
    , fs = require('fs')
    , dt = (new Date()).getTime()
    , output
    , prc = 'childprc.' + dt
  ;

  // execute the command and redirect output to controlled names, using the ';'
  // because I don't care about the status of the exited process, just that it
  // is done
  child_process.exec(cmd+' &>'+prc+'.out ; echo done! >'+prc+'.done');

  // loop to check the file system for the 'done' indicator
  while (!fs.existsSync(prc + '.done')) {
    // wait for the file till it is there, indicating the spawned process
    // has completed
  }

  // once the 'done' indicator appears, get the output of the command
  output = fs.readFileSync(prc+'.out');

  // delete the 'done' indicator and the output
  fs.unlinkSync(prc+'.out');
  fs.unlinkSync(prc+'.done');

  return output;
}
exports.cmd = __cmdSync;
