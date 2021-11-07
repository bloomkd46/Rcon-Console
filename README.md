<span align="center">

    

[![terminal-icon](https://badgen.net/badge/icon/Rcon-Console?icon=terminal&label&scale=5&color=green)]()
    
[![version](https://badgen.net/npm/v/rcon-console?cache=300)](https://www.npmjs.com/package/rcon-console)
[![downloads](https://badgen.net/npm/dt/rcon-console?cache=300&scale=1.15)](https://npmcharts.com/compare/rcon-console?minimal=true)
[![license](https://badgen.net/github/license/micromatch/micromatch)](https://github.com/bloomkd46/rcon-console/blob/master/LICENSE.md)
###
    
node-rcon is a simple library for connecting to RCON servers in node.js.
It implements the protocol used by Valve's Source and GoldSrc engines,
as well as many other game servers. It was originally created to connect to Minecraft's RCON server.

</span>

## Installation

npm:
Make sure that you are running node.js 12.20.0 or newer (`node -v`)
```shell
npm install -g rcon-console
```
## Usage

See [`examples/basic.js`](https://github.com/pushrax/node-rcon/blob/master/examples/basic.js) for a simple example, or
[`examples/stdio.js`](https://github.com/pushrax/node-rcon/blob/master/examples/stdio.js) for a complete command line client.

### Commands And Options
| Command | Description |
| :-|- |
| help | Display the help menu|
| 

Here's a non-exhaustive list of which games use which options:

| Game              | Protocol  | Challenge |
| :---------------- | :-------- | :-------- |
| Any Source game   | TCP       | N/A       |
| Minecraft         | TCP       | N/A       |
| Any GoldSrc game  | UDP       | Yes       |
| Call of Duty      | UDP       | No        |

Source games include CS:S, CS:GO, TF2, etc. GoldSrc games include CS 1.6, TFC,
Ricochet (lol), etc.

If there's a game you know uses a certain protocol, feel free to submit a pull
request.

Please submit a bug report for any game you try that doesn't work!

Note that some servers may close the connection if it is idle for a long period of time.
