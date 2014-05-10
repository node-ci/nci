'use strict';

var spawn = require('child_process').spawn,
	ParentCommand = require('./base').BaseCommand,
	inherits = require('util').inherits;

function Command(params) {
	params = params || {};
	ParentCommand.call(this, params);
	this.cwd = params.cwd;
}

exports.SpawnCommand = Command;

inherits(Command, ParentCommand);

Command.prototype.exec = function(params, callback) {
	var self = this,
		stdout = '';
	var cmd = spawn(params.cmd, params.args, {cwd: this.cwd});
	cmd.stdout.on('data', function(data) {
		if (self.isEmit) self.emit('stdout', data);
		stdout += data;
	});
	cmd.stderr.on('data', function(data) {
		callback(new Error('Scm outputs to stderr: ' + data));
		cmd.kill();
	});
	cmd.on('exit', function(code) {
		var err = null;
		if (code !== 0) err = new Error(
			'Scm command exits with non-zero code: ' + code
		);
		callback(err, stdout);
	});
	return cmd;
};
