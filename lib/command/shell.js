'use strict';

if (process.platform === 'win32') {
	var DefaultShell = 'cmd';
	var DefaultShellArg0 = '/C';
} else {
	var DefaultShell = '/bin/sh';
	var DefaultShellArg0 = '-c';
}

var ParentCommand = require('./spawn').Command,
	inherits = require('util').inherits;

function Command(params) {
	params = params || {};
	ParentCommand.call(this, params);
	this.shell = params.shell || DefaultShell;
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
		args: [DefaultShellArg0, params.cmd],
		options: params.options
	}, callback);
};
