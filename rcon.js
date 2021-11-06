#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rconConsole = void 0;
process.title = 'rcon';
const commander = require('commander');
const Rcon = require('rcon');
const child_process = require("child_process");
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});
const fs = require('fs');
const version = require('./package.json').version;
const ora = require("ora");
var authenticate = ora({text: 'Authenticating...', discardStdin: false, color: "yellow"});
var command = ora({text:"Something went wrong, please try again", discardStdin: false, color: "cyan"});

//var credentials = require('./credentials.json');
var config = require('./config.json');
var authenticated = false;
var queuedCommands = [];
const program = new commander.Command();
const rcon = new Rcon(config.host, config.port, config.password);
class rconConsole {
  constructor() {
    commander
      .showHelpAfterError()
      .showSuggestionAfterError()
      .version(version)
      .arguments('[reset|uninstall|rebuild|help]')
      .option('-H, --host <host>', 'This is the host that the Rcon will connect to (default: ' + config.host + ")", (p) => this.cache("host", p))
      .option('-P, --port <port>', 'This is the port that the Rcon connection will be established on (default: ' + config.port + ")", (p) => config.port = p)
      .option('-p, --password <password>', 'specify the rcon password (default: ' + config.password + ")", (p) => config.password = p)
      .option('--tcp <true/false>', 'choose which rcon protocol to use, true for TCP and False for UDP (default: ' + config.options.tcp + ")", (p) => config.options.tcp = p)
      .option('-s, --save', 'save your port, host, and password to the config.json', () => this.updateConfig())
      .action((cmd) => {
        this.action = cmd;
      })
      .parse();
    switch (this.action) {
      case 'reset': {
        console.log('Reseting...');
        fs.writeFileSync('./config.json', JSON.stringify(require('./default_config.json'), null, 2));
        process.exit(1);
      }
      case 'uninstall': {
        console.log('Uninstalling...');
        child_process.exec('npm uninstall rcon-console', (error) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return;
          }
          console.log(`successfully uninstalled rcon-console`);
          process.exit(1);
        });
        process.exit(1);
      }
      case 'rebuild': {
        console.log('Rebuilding...');
        child_process.exec('npm install rcon-console -g', (error) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return;
          }
          console.log(`successfully rebuilt rcon-console`);
          process.exit(1);
        });
        break;
      }
      case 'help': {
        commander.outputHelp();
        console.log('Please provide a command:');
        console.log('    reset                            resets the configuration');
        console.log('    uninstall                        uninstall the program from your device');
        console.log('    rebuild                          rebuild all your files (use after updating)');
        console.log('\nSee the wiki for help with hb-service: https://git.io/JTtHK \n');
        process.exit(1);
      }
      default: {
        authenticate.start("Authenticating...");
        rcon.connect();

      }
    }

  }
  cache(key, value) {
    console.log("Setting " + key + " to " + value);
    config[key] = value;
    rcon[key] = value;
  }
  updateConfig() {
    //config.host = "10.0.0.5";
    console.log("Updating Configuration...")
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
    config = require('./config.json');
  }
}
readline.on('line', (content) => {
  if (authenticated) rcon.send(content); else queuedCommands.push(content);
  command.start(content);
});

rcon.on('auth', function () {
  authenticate.succeed('Authenticated');
  authenticated = true;

  // You must wait until this event is fired before sending any commands,
  // otherwise those commands will fail.
  //
  // This example buffers any commands sent before auth finishes, and sends
  // them all once the connection is available.

  for (var i = 0; i < queuedCommands.length; i++) {
    console.log("Queued Command Sent: " + queuedCommands[i]);
    rcon.send(queuedCommands[i]);
  }

  queuedCommands = [];
}).on('response', function (str) {
  if(str.includes("Unknown or incomplete command, see below for error")) command.fail("Unknown or incomplete command, see below for error\n"+str.slice(50)); else command.succeed(str);
}).on('error', function (err) {
  if (!authenticated) authenticate.fail("Error: Authentication failed"); else command.fail("Error encountered");
  console.error(err);
  console.error("host: " + config.host + ", port: " + config.port + ", password: " + config.password);
}).on('end', function () {
  console.log("Connection closed");
  authenticated = false;
  //process.exit();
});
exports.rconConsole = rconConsole;
function bootstrap() {
  return new rconConsole();
}
bootstrap();