'use strict';

var ParentCommand = require('./spawn').Command,
	inherits = require('util').inherits;

function Command(params) {
	params = params || {};
	ParentCommand.call(this, params);
	this.shell = params.shell || '/bin/sh';
}

exports.Command = Command;

inherits(Command, ParentCommand);


/**
 * Executes `params.cmd` (e.g. 'echo 1 && echo 2') in a `shell`
 * (which was set at constructor) with `params.options`
 */
Command.prototype.run = function(params, callback) {
	ParentCommand.prototype.run.call(this, {
		cmd: this.shell, args: ['-c', params.cmd], options: params.options
	}, callback);
};
