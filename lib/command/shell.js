'use strict';

var ParentCommand = require('./spawn').Command,
	inherits = require('util').inherits;

function Command(params) {
	ParentCommand.call(this, params);
}

exports.ShellCommand = Command;

inherits(Command, ParentCommand);


/**
 * Executes `params.cmd` (e.g. 'echo 1 && echo 2') in `params.shell`
 * (e.g. '/bin/sh') with `params.options`
 */
Command.prototype.run = function(params, callback) {
	if (!params.shell) return callback(new Error('`shell` is not set'));
	if (!params.cmd) return callback(new Error('`cmd` is not set'));
	ParentCommand.prototype.exec.call(this, {
		cmd: params.shell, args: ['-c', params.cmd], options: params.options
	}, callback);
};
