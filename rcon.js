#!/usr/bin/env node
// This example reads commands from stdin and sends them on enter key press.
// You need to run `npm install keypress` for this example to work.

const commander = require('commander');
const Rcon = require('rcon');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});
const fs = require('fs');
//var credentials = require('./credentials.json');
var rcon = new Rcon(null, null, null);
var authenticated = false;
var queuedCommands = [];
const program = new commander.Command();
immediateTermination = false;


program
  //.arguments("[connect|config|run <command>]")
  .showHelpAfterError()
  .showSuggestionAfterError()
  .option('-p, --port <port>', 'This is the port that the Rcon connection will be established on', (p) => storeValue("port", p))
  .option('-h, --host <host>', 'This is the host that the Rcon will connect to', (p) => storeValue("host", p))
  .option('-P, --password <password>', 'specify the rcon password', (p) => storeValue("password", p))
  //.argument('config',  "This will open the configuration menu",() => openConfig())
  .argument('run <command>', "this will run your specified command then close the connection", (i) => sendCommand(i))
  .parse();

function sendCommand(cmd) {
  immediateTermination = true;
  rcon = new Rcon(getValue("host"), getValue("port"), getValue("password"));
  queuedCommands.push(cmd);
  rcon.connect();
  //rcon.send(program.opts().run);
}
function nothing() {

}
function openConfig() {
  readline.question('What port would you like to use? \n', port => {
    cache.set("port", port);
  });
  readline.question('\nWhat host would you like to connect to? \n', host => {
    cache.set("host", host);
  });
  readline.question('\nWhat is the rcon password? \n', password => {
    cache.set("password", password)
  });
  console.log("Successfully configured!");
  process.exit();
}
function storeValue(id, value) {
  console.log("Updating " + id + " to " + value)
  switch (id) {
    case 'port': {
      item = { port: value, host: getValue("host"), password: getValue("password")};
    }
    case 'host': {
      item = { host: value, password: getValue("password") , port: getValue("port") };
    }
    case 'password': {
      item = { password: value , port: getValue("port"), host: getValue("host")};
    }
  }
  fs.writeFileSync('./credentials.json', JSON.stringify(item), err => { if (err) console.error(err) });
}
function getValue(id) {
  results = JSON.parse(fs.readFileSync('./credentials.json', (err, data) => results = JSON.parse));
  results = require('./credentials.json');
  //console.log(results);
  return results[id];
}

rcon.on('auth', function () {
  console.log("Connected");
  readline.question(`> `, command => {
    if (command == 'close' || command == 'exit') process.exit();
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
  if(immediateTermination) process.exit();
}).on('response', function (str) {
  console.log(str);
  readline.question(`> `, command => {
    if (command == 'close' || command == 'exit') process.exit();
    rcon.send(command)
    //    readline.close()
  })
}).on('error', function (err) {
  console.error(err);
  console.error("host: " + getValue("host") + ", port: " + getValue("port") + ", password: " + getValue("password"));
}).on('end', function () {
  readline.close();
  console.info("Connection closed");
  process.exit();
});
