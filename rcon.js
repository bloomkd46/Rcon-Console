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
const latestVersion = semver.clean(child_process.execSync('npm view rcon-console version').toString());
const version = semver.clean(require('./package.json').version);
const outOfDate = semver.lt(version, latestVersion);
const versionDiff = semver.diff(version, latestVersion);
const ora = require("ora");
var versionHandler = ora({ discardStdin: false, color: "red" });
var authenticate = ora({ text: 'Authenticating...', discardStdin: false, color: "yellow" });
var command = ora({ text: "Something went wrong, please try again", discardStdin: false, color: "cyan" });
var action = ora({ discardStdin: false, color: "green" });
//var credentials = require('./credentials.json');
var actionArguments;
var configExists = fs.existsSync('./lib/config.json');
var config = configExists ? require('./lib/config.json') : addConfig();
const questions = require('./lib/lock/configuration_questions.json');
var question = 1;
const { emit, stdin } = require('process');
var authenticated = false;
var queuedCommands = [];
config.options.tcp = config.options.protocol.toLowerCase() === "tcp" ? true : false;
const rcon = new Rcon(config.host, config.port, config.password, config.options);
var configuring = false;
class rconConsole {
  constructor() {
    versionHandler.start("Checking for updates...");
    try {
      if (versionDiff != null) versionHandler.warn('you are a' + versionDiff + ' version behind, run `rcon update` to update to version ' + latestVersion); else versionHandler.succeed("You are up-to-date with version " + version)
    } catch (error) {
      versionHandler.fail("Error while checking for updates\n" + error);
    }
    commander
      .showHelpAfterError()
      .showSuggestionAfterError()
      .version(version)
      .arguments('[reset|uninstall|rebuild|help|config [option]]')
      .addHelpText('after', `
      Please provide a command:

          uninstall                        uninstall the program from your device
          rebuild                          rebuild rcon-console (use if crashing)
          update                           updates rcon-console
          config                           view your config.json
          config edit                      edit your config.json
          config reset                     reset your the configuration

          See the wiki for help: https://github.com/bloomkd46/rcon-console/wiki
      `)
      .option('-H, --host <host>', 'This is the host that the Rcon will connect to (default: ' + config.host + ")", (p) => cache("host", p))
      .option('-P, --port <port>', 'This is the port that the Rcon connection will be established on (default: ' + config.port + ")", (p) => cache("port", p))
      .option('-p, --password <password>', 'specify the rcon password (default: ' + config.password + ")", (p) => cache("password", p))
      .option('--protocol <protocol>', 'choose which rcon protocol, TCP or UDP (default: ' + config.options.protocol + ")", (p) => cache("options", p.toLocaleLowerCase ? true : false, "tcp"))
      .option('-C, --challenge <true/false>', 'choose wether to use the rcon challenge protocal (default: ' + config.options.challenge + ")", (p) => cache("options", p, "challenge"))
      .option('-S, --save', 'save your port, host, and password to the config.json', () => updateConfig())
      .action((cmd, cmdArgs) => {
        console.log(cmd);
        this.action = cmd;
        actionArguments = cmdArgs;
      })
      .parse();
    switch (this.action) {
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
        if(actionArguments === "edit"){
          configuring = true;
          action.info(questions[question + "-description"]);
        } else if(actionArguments === "reset"){
          action.start("Reseting configuration...");
          try {
            fs.writeFileSync('./lib/config.json', JSON.stringify(require('./lib/lock/default_config.json'), null, 2));
            action.succeed("configuration successfully reset");
          } catch (error) {
            action.fail("Error: Unable to reset configuration\n" + error);
          }
          process.exit(0);
        }else{
          action.start("Loading configuration...");
          try {
            action.succeed(JSON.stringify(config, null, 2))
          } catch (error) {
            action.fail("Error loading configuration " + error)
          }
        }
        break;
      }
      default: {
        authenticate.start("Authenticating...");
        rcon.connect();
        if (this.action) {
          command.start(this.action);
          if (authenticated) rcon.send(this.action); else queuedCommands.push(this.action);
        }
        break;
      }
    }

  }

}
readline.on('line', (content) => {
  if (configuring && question < questions.length) {
    configure(question, content);
    question++;
  } else if (configuring) {
    updateConfig();
    configuring = false;
    authenticate.start("Authenticating...");
    rcon.connect();
  } else {
    command.start(content);
    if (authenticated) rcon.send(content); else queuedCommands.push(content);
  }
  /*if (question > 6 && configuring) { configuring = false; updateConfig(); authenticate.start("Authenticating..."); rcon.connect() }
  if (configuring) {
    if (question > 3) {
      cache("options", content, questions[question + 1]);
      if (question == 5) {
        action.info("Would you like to enable keepAlive? (true/false)");
      } else if (question == 4) action.info("would you like to use the challenge protocal? (true/false)");
    } else {
      cache(questions[question], content);
      if (question == 3) action.info("would you like to use TCP or UDP? (true for TCP, false for UDP)"); else action.info("what would you like to set the " + questions[question + 1] + " to?");

    }
    question++;
  }*/
}).on('SIGINT', () => {
  authenticate.start("Shutting Down...");
  setTimeout(() => {
    try {
      rcon.disconnect();
      authenticate.succeed("Successfully shut down");
    } catch (error) {
      authenticate.fail("Error while trying to shut down\n" + error);
    }
    process.exit(1);
  }, 500);
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
  if (config.keepAlive) {
    authenticate.start("Authenticating...");
    rcon.connect();
  } else {
    process.exit(1);
  }
});
function cache(key, value, _key2) {
  action.start("Setting " + key + " to " + value);
  try {
    if (_key2) {
      config[key][_key2] = value;
      rcon[key + "." + _key2] = value;
      action.succeed("Successfully set " + key + "." + _key2 + " to " + value);
      config.options.tcp = config.options.protocol.toLocaleLowerCase === "tcp" ? true : false;
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
  action.start("Reseting configuration...");
  try {
    config.options.tcp = config.options.protocol.toLocaleLowerCase === "tcp" ? true : false;
    fs.writeFileSync('./lib/config.json', JSON.stringify(require('./lib/lock/default_config.json'), null, 2));
    action.succeed("configuration successfully reset");
    //this.action = 'reset';
  } catch (error) {
    action.fail("Error: Unable to reset configuration\n" + error);
  }
  action.start("Updating Configuration...");
  try {
    fs.writeFileSync('./lib/config.json', JSON.stringify(config, null, 2));
    config = require('./lib/config.json');
    action.succeed("Successfully updated your configuration");
  } catch (error) {
    action.fail("Failed to update configuration, " + error);
  }
}
function configure(questionn, response) {

  if (questionn > questions["options-after"]) {
    cache("options", response, questions[questionn]);
    config.options.tcp = config.options.protocol.toLocaleLowerCase === "tcp" ? true : false;
  } else {
    cache(questions[questionn], response);
  }
  action.info(questions[(questionn + 1) + "-description"]);
}
function addConfig() {
  action.start("Adding configuration...");
  try {
    fs.writeFileSync('./lib/config.json', JSON.stringify(require('./lib/lock/default_config.json'), null, 2));
    action.succeed("configuration successfully added");
    return require('./lib/config.json');
  } catch (error) {
    action.fail("Error: Unable to add configuration\n" + error);
  }
}
exports.rconConsole = rconConsole;
function bootstrap() {
  return new rconConsole();
}
bootstrap();