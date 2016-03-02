'use strict';

var spawn = require('child_process').spawn,
	ParentCommand = require('./base').Command,
	inherits = require('util').inherits,
	_ = require('underscore');

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
		stdout = self.collectOut ? '' : null,
		stderr = self.attachStderr ? '' : null;

	callback = _(callback).once();

	if (!params.cmd) return callback(new Error('`cmd` is not set'));
	if (!params.args) return callback(new Error('`args` is not set'));
	params.options = params.options || {};
	params.options.cwd = params.options.cwd || this.cwd;

	var cmd = spawn(params.cmd, params.args, params.options);

	if (self.emitIn) {
		self.emit('stdin', params.cmd + ' ' + params.args.join(' ') + '\n');
	}

	var extendError = function (err) {
		err.message = (
			'Error while spawn "' +
			[params.cmd].concat(params.args || []).join(' ') + '": ' +
			err.message
		);

		return err;
	};

	cmd.stdout.on('data', function(data) {
		if (self.emitOut) self.emit('stdout', data);
		if (self.collectOut) stdout += data;
	});

	cmd.stderr.on('data', function(data) {
		if (self.emitErr) self.emit('stderr', data);
		if (self.attachStderr) stderr += data;
	});

	cmd.on('close', function(code) {
		var err = null;
		if (code !== 0) {
			err = extendError(
				new Error('Spawned command exits with non-zero code: ' + code)
			);
			err.stderr = stderr;
		}
		callback(err, stdout);
	});

	cmd.on('error', function(err) {
		callback(extendError(err));
	});

	return cmd;
};
