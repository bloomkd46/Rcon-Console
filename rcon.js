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
const semver = require('semver');
var outOfDate;
var latestVersion;
const version = require('./package.json').version;
const checkForUpdates = child_process.execSync('npm view rcon-console version', (error, stdout) => {
  if (error) {
    return error;
  } else if (semver.gte(semver.clean(version), semver.clean(stdout))) {
    outOfDate = false;
  } else {
    outOfDate = true;
    console.log('you are a %s version behind, run `rcon update` to update', semver.diff(semver.clean(version), semver.clean(stdout)));
  }
  latestVersion = semver.clean(stdout);
});

const ora = require("ora");
var authenticate = ora({ text: 'Authenticating...', discardStdin: false, color: "yellow" });
var command = ora({ text: "Something went wrong, please try again", discardStdin: false, color: "cyan" });
var action = ora({ discardStdin: false, color: "green" });
//var credentials = require('./credentials.json');
var config = require('./config.json');
const questions = require('./configuration_questions.json');
var question = 0;
const { emit, stdin } = require('process');
var authenticated = false;
var queuedCommands = [];
const program = new commander.Command();
const rcon = new Rcon(config.host, config.port, config.password, config.options);
var configuring = false;
class rconConsole {
  constructor() {
    commander
      .showHelpAfterError()
      .showSuggestionAfterError()
      .version(version)
      .arguments('[reset|uninstall|rebuild|help|config]')
      .addHelpText('after', `
      Please provide a command:

          reset                            resets the configuration
          uninstall                        uninstall the program from your device
          rebuild                          rebuild rcon-console (use if crashing)
          update                           updates rcon-console
          config                           update your config.json values

          See the wiki for help: https://github.com/bloomkd46/rcon-console/wiki
      `)
      .option('-H, --host <host>', 'This is the host that the Rcon will connect to (default: ' + config.host + ")", (p) => cache("host", p))
      .option('-P, --port <port>', 'This is the port that the Rcon connection will be established on (default: ' + config.port + ")", (p) => cache("port", p))
      .option('-p, --password <password>', 'specify the rcon password (default: ' + config.password + ")", (p) => cache("password", p))
      .option('--tcp <true/false>', 'choose which rcon protocol to use, true for TCP and False for UDP (default: ' + config.options.tcp + ")", (p) => cache("options", p, "tcp"))
      .option('-C, --challenge <true/false>', 'choose wether to use the rcon challenge protocal (default: ' + config.options.challenge + ")", (p) => cache("options", p, "challenge"))
      .option('-S, --save', 'save your port, host, and password to the config.json', () => updateConfig())
      .action((cmd) => {
        this.action = cmd;
      })
      .parse();
    switch (this.action) {
      case 'reset': {
        action.start("Reseting configuration...");
        try {
          fs.writeFileSync('./config.json', JSON.stringify(require('./default_config.json'), null, 2));
          action.succeed("configuration successfully reset");
        } catch (error) {
          action.fail("Error: Unable to reset configuration\n" + error);
        }
        process.exit(1);
      }
      case 'uninstall': {
        action.start("Uninstalling...");
        child_process.exec('npm uninstall rcon-console', (error) => {
          if (error) {
            action.fail("Error: Unable to uninstall rcon-console\n" + error);
            return;
          } else {
            action.succeed("Successfully uninstalled rcon-console");
          }
        });
        process.exit(1);
      }
      case 'rebuild': {
        action.start('Rebuilding...');
        child_process.exec('npm install -g rcon-console@' + version, (error) => {
          if (error) {
            action.fail(`exec error: ${error}`);
            return;
          }
          action.succeed(`successfully rebuilt rcon-console`);
          process.exit(1);
        });
        break;
      }
      case 'update': {
        action.start("Updating from v" + version + " to v" + latestVersion);
        if (outOfDate) {
          child_process.exec('npm install -g rcon-console@' + latestVersion, (error) => {
            if (error) {
              action.fail(`exec error: ${error}`);
              return;
            }
            action.succeed(`successfully updated rcon-console to v` + latestVersion);
            process.exit(1);
          });
        } else {
          action.fail("Already Up-To-Date with v" + version);
        }
        process.exit(1);
      }
      case 'help': {
        commander.outputHelp();
        break;
      }
      case 'config': {
        configuring = true;
        action.info("what would you like to set the "+ questions[question+1] + " to?");
        break;
      }
      default: {
        authenticate.start("Authenticating...");
        rcon.connect();
        if (this.action) {
          command.start(this.action);
          if (authenticated) rcon.send(this.action); else queuedCommands.push(this.action);
        }
      }
    }

  }

}
readline.on('line', (content) => {
  if (configuring) {
    if (question > 5) { updateConfig(); process.exit(1); }
    if (question >= 4) {
      question++;
      cache("options", content, questions[question+1]);
      if (question == 5) action.info("would you like to use the challeng protocal? (true/false)");
    } else {
      question++;
      cache(questions[question], content);
      if (question == 4) action.info("would you like to use TCP or UDP? (true for TCP, false for UDP)");
      action.info("what would you like to set the "+ questions[question+1] + " to?");
    }
    console.log(questions[question + 1]);
  } else {
    command.start(content);
    if (authenticated) rcon.send(content); else queuedCommands.push(content);
  }
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
    command.start(queuedCommands[i]);
    rcon.send(queuedCommands[i]);
  }

  queuedCommands = [];
}).on('response', function (str) {
  if (str.includes("Unknown or incomplete command, see below for error")) command.fail("Unknown or incomplete command, see below for error\n" + str.slice(50)); else command.succeed(str);
}).on('error', function (err) {
  if (!authenticated) authenticate.fail("Authentication failed\n" + JSON.stringify(err, null, 2)); else command.fail("Error encountered: " + err);
}).on('end', function () {
  console.log("Connection closed, Reconnecting...");
  authenticated = false;
  authenticate.start("Authenticating...");
  rcon.connect();
  //process.exit();
});
function cache(key, value, _key2) {
  action.start("Setting " + key + " to " + value);
  try {
    if (_key2) {
      config[key][_key2] = value;
      rcon[key + "." + _key2] = value;
      action.succeed("Successfully set " + key + " to " + value);
    } else {
      config[key] = value;
      rcon[key] = value;
      action.succeed("Successfully set " + key + " to " + value);
    }
  } catch (error) {
    if (_key2) {
      action.fail("Failed to set " + key + "." + _key2 + " to " + value + "\n" + error);
    } else {
      action.fail("Failed to set " + key + " to " + value + "\n" + error);
    }
  }

}
function updateConfig() {
  //config.host = "10.0.0.5";
  action.start("Updating Configuration...");
  try {
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
    config = require('./config.json');
    action.succeed("Successfully updated configuration");
  } catch (error) {
    action.fail("Failed to update configuration, " + error);
  }
}
exports.rconConsole = rconConsole;
function bootstrap() {
  return new rconConsole();
}
bootstrap();
