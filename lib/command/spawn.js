'use strict';

var spawn = require('child_process').spawn,
	ParentCommand = require('./base').Command,
	inherits = require('util').inherits,
	utils = require('../utils');

function Command(params) {
	params = params || {};
	ParentCommand.call(this, params);
	this.cwd = params.cwd;
}

exports.Command = Command;

inherits(Command, ParentCommand);

/**
 * Executes `params.cmd` with `params.args` and `params.options`
 */
Command.prototype.run = function(params, callback) {
	var self = this,
		stdout = self.isCollect ? '' : null;
	if (!params.cmd) return callback(new Error('`cmd` is not set'));
	if (!params.args) return callback(new Error('`args` is not set'));
	callback = utils.once(callback);
	params.options = params.options || {};
	params.options.cwd = params.options.cwd || this.cwd;
	var cmd = spawn(params.cmd, params.args, params.options);
	cmd.stdout.on('data', function(data) {
		if (self.isEmit) self.emit('stdout', data);
		if (self.isCollect) stdout += data;
	});
	cmd.stderr.on('data', function(data) {
		callback(new Error('Spawned command outputs to stderr: ' + data));
		cmd.kill();
	});
	cmd.on('close', function(code) {
		var err = null;
		if (code !== 0) err = new Error(
			'Spawned command exits with non-zero code: ' + code
		);
		callback(err, stdout);
	});
	return cmd;
};
