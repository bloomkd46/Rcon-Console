<span align="center">

    

[![terminal-icon](https://badgen.net/badge/icon/Rcon-Console?icon=terminal&label&scale=10&color=green)](README.md)
    
[![version](https://badgen.net/npm/v/rcon-console?cache=300)](https://www.npmjs.com/package/rcon-console)
[![downloads](https://badgen.net/npm/dt/rcon-console?cache=300&scale=1.15)](https://npmcharts.com/compare/rcon-console?minimal=true)
[![license](https://badgen.net/github/license/bloomkd46/rcon-console)](https://github.com/bloomkd46/rcon-console/blob/master/LICENSE.md)
###
    
node-rcon is a simple library for connecting to RCON servers in node.js.
It implements the protocol used by Valve's Source and GoldSrc engines,
as well as many other game servers. It was originally created to connect to Minecraft's RCON server.

</span>

## Installation

npm:
> Make sure that you are running [node.js](https://nodejs.org/en/download/) 12.20.0 or newer (`node -v`)

```bash
npm install -g rcon-console
```
## Usage
here are some example commands (if the command is more than 2 words surrond with `""`'s)
```bash
rcon #This will connect without auto-executing any commands
rcon summon lightning_bolt #This will run `summon lightning_bolt` once connected
rcon "summon lightning_bolt ~ ~ ~" #This will run `summon lightning_bolt ~ ~ ~` once connected
```
this will connect to `localhost:25575` with a password of `password`

for more commands and options see the [wiki](../../wiki#Rcon-Console)
## Configuration
to change you config run `rcon config edit`

then either press enter to use the default value or type in what you want to change the value to.

for more options see [configuration](../../wiki#Configuration)

> Please submit a [bug report](../../issues/new/choose) for any game you try that doesn't work!

> Note that some servers may close the connection if it is idle for a long period of time. enable keepAlive in your config to fix this.
