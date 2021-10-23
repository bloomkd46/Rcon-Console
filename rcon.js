#!/usr/bin/env node
// This example reads commands from stdin and sends them on enter key press.
// You need to run `npm install keypress` for this example to work.

const commander = require('commander');
var Rcon = require('rcon');
//var rcon = new Rcon('localhost', 1234, 'password');
var authenticated = false;
var queuedCommands = [];
const program = new commander.Command();
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
})
console.log('Authenticating...')
program
.showHelpAfterError()
.showSuggestionAfterError()
  .option('-P, --port <port>', 'choose the port', '25575')
  .option('-H, --host <host>', 'choose the host ip', 'localhost')
  .option('-p, --password <password>', 'specify the rcon password', 'password')
  .parse();
var rcon = new Rcon(program.opts().host, program.opts().port, program.opts().password);
rcon.connect();
//rcon.send(process.stdin);
rcon.on('auth', function() {
  console.log("Authenticated");
  readline.question(`> `, command => {
    if(command == 'close' || command == 'exit') process.exit();
    rcon.send(command)
//    readline.close()
  })
  authenticated = true;

  // You must wait until this event is fired before sending any commands,
  // otherwise those commands will fail.
  //
  // This example buffers any commands sent before auth finishes, and sends
  // them all once the connection is available.

  for (var i = 0; i < queuedCommands.length; i++) {
    rcon.send(queuedCommands[i]);
  }
  queuedCommands = [];

}).on('response', function(str) {
  console.log(str);
  readline.question(`> `, command => {
    if(command == 'close' || command == 'exit') process.exit();
    rcon.send(command)
//    readline.close()
  })
}).on('error', function(err) {
  console.log("Error: " + err);
}).on('end', function() {
  readline.close();
  console.log("Connection closed");
  process.exit();
});

