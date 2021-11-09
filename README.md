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
Make sure that you are running node.js 12.20.0 or newer (`node -v`)
```bash
npm install -g rcon-console
```
## Usage
to get started run 
```bash
rcon summon lightning_bolt
```
this will connect to `localhost:25575` with a password of `password` and run command `summon lightning_bolt`
## Configuration
to change you config run `rcon config edit`
then either press enter to use the default value or type in what you want to change the value to.
for more options see [configuration](/wiki#Configuration)

#### Please submit a bug report for any game you try that doesn't work!
#### Note that some servers may close the connection if it is idle for a long period of time. enable keepAlive in your config to fix this.
