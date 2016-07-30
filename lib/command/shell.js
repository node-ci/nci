'use strict';

var defaultShell, defaultShellCmdArg;

if (process.platform === 'win32') {
	defaultShell = 'cmd';
	defaultShellCmdArg = '/C';
} else {
	defaultShell = '/bin/sh';
	defaultShellCmdArg = '-c';
}

var ParentCommand = require('./spawn').Command,
	inherits = require('util').inherits;

function Command(params) {
	params = params || {};
	ParentCommand.call(this, params);
	this.shell = params.shell || defaultShell;
	this.shellCmdArg = params.shellCmdArg || defaultShellCmdArg;
}

exports.Command = Command;

inherits(Command, ParentCommand);


/**
 * Executes `params.cmd` (e.g. 'echo 1 && echo 2') in a `shell`
 * (which was set at constructor) with `params.options`
 */
Command.prototype.run = function(params, callback) {
	ParentCommand.prototype.run.call(this, {
		cmd: this.shell,
		args: [this.shellCmdArg, params.cmd],
		options: params.options
	}, callback);
};
