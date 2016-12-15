'use strict';

var ParentCommand = require('./spawn').Command,
	inherits = require('util').inherits;

var defaultShell, defaultShellCmdArg;

if (process.platform === 'win32') {
	defaultShell = 'cmd';
	defaultShellCmdArg = '/C';
} else {
	defaultShell = '/bin/sh';
	defaultShellCmdArg = '-c';
}

function Command(params) {
	params = params || {};
	ParentCommand.call(this, params);
	this.shell = params.shell || defaultShell;
	this.shellCmdArg = params.shellCmdArg || defaultShellCmdArg;
	this.shellExtraArgs = params.shellExtraArgs || [];
}

exports.Command = Command;

inherits(Command, ParentCommand);


/**
 * Executes `params.cmd` (e.g. 'echo 1 && echo 2') in a `shell`
 * (which was set at constructor) with `params.options`
 */
Command.prototype.run = function(params, callback) {
	return ParentCommand.prototype.run.call(this, {
		cmd: this.shell,
		args: this.shellExtraArgs.concat(this.shellCmdArg).concat(params.cmd),
		options: params.options,
		envVars: params.envVars
	}, callback);
};
