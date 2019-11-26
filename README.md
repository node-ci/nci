
# nci

Flexible, open source continuous integration server written in node.js


It's good for those who prefer modular things to build system for specific
requirements by blocks, starting from small core then extend functionality
by plugins.


[![Npm version](https://img.shields.io/npm/v/nci.svg)](https://www.npmjs.org/package/nci)
[![Build Status](https://travis-ci.org/node-ci/nci.svg?branch=master)](https://travis-ci.org/node-ci/nci)
[![Coverage Status](https://coveralls.io/repos/github/node-ci/nci/badge.svg?branch=master&v3)](https://coveralls.io/github/node-ci/nci?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/npm/nci/badge.svg)](https://snyk.io/test/npm/nci)


## Features

* modular approach, small core a lot of plugins (e.g. rest api, web interface - 
plugins, not core)
* modest system requirements (only node and scm clients are required, no
external db)
* pluginnable db storage (any [levelup](https://github.com/Level/levelup)
backend could be used)
* using on-the-fly snappy compression for all stored data (builds, build logs)
when leveldb (via leveldown backend) is used
* working with any mercurial, git repositories (no matter is it service like
github, bitbucket or private server, all you need is authenticate user from
which nci server is running without password e.g. by ssh key)
* damn fast single page web application interface
([classic ui plugin](https://github.com/node-ci/nci-classic-ui))
* server and projects could be configured with yaml
([yaml reader plugin](https://github.com/node-ci/nci-yaml-reader)) - provides
pretty shell scripting (strings without quotes, nice multiline strings, etc)
* provides agile project relations out of the box (see `blocks`, `blockedBy`,
`trigger` at [sample project config](./docs/sample-project-config.yaml))
* could catch every or specific commits (see `catchRev` at
[sample project config](./docs/sample-project-config.yaml))


## System requirements

* unix-like operating system, not tested on windows
* node.js >= 0.10
* git client >= 1.9 (only for building git projects)
* mercurial client >= 2.8 (only for building mercurial projects)


## Quick setup

Clone quick setup repo, go into it and install dependencies.

You can choose from one of following repositories with sample configurations:

* With local node (all builds will be executed locally from user that started
nci server):

```sh

git clone https://github.com/node-ci/nci-quick-setup && cd nci-quick-setup && npm install

```

* With docker node (all builds will be executed within docker, requires
installed docker client and server):

```sh

git clone https://github.com/node-ci/nci-docker-node-quick-setup && cd nci-docker-node-quick-setup && npm install

```

After installing dependencies run nci:


```sh

node_modules/.bin/nci

```

that's all, now you can experiment with it by adding/changing projects,
use web interface (on http://127.0.0.1:3000 by default) for run project builds,
etc.

Currently web interface doesn't support adding new projects or editing of
existing projects. You have to do that by adding/editing project config
file.

See [basic tutorial](https://github.com/node-ci/nci/blob/master/docs/tutorials/standalone-web-ui.md)
for setup and usage details.


## Resources

* [basic tutorial](./docs/tutorials/standalone-web-ui.md)
* [online demo](http://classicui-ncidemo.rhcloud.com/)
* [sample project config](./docs/sample-project-config.yaml)
* [developing plugins doc](./docs/developing-plugins)


## Plugins

* [docker node plugin](https://github.com/node-ci/nci-docker-node)
* [ssh node plugin](https://github.com/node-ci/nci-ssh-node)
* [yaml reader plugin](https://github.com/node-ci/nci-yaml-reader)
* [classic ui plugin](https://github.com/node-ci/nci-classic-ui)
* [static server plugin](https://github.com/node-ci/nci-static-server)
* [mail notification plugin](https://github.com/node-ci/nci-mail-notification)
* [jabber notification plugin](https://github.com/node-ci/nci-jabber-notification)
* [telegram notification plugin](https://github.com/node-ci/nci-telegram-notification)
* [projects reloader plugin](https://github.com/node-ci/nci-projects-reloader)
* [rest api server plugin](https://github.com/node-ci/nci-rest-api-server)
* [scheduler plugin](https://github.com/node-ci/nci-scheduler)
* [express plugin](https://github.com/node-ci/nci-express)
* [shields plugin](https://github.com/node-ci/nci-shields)
