'use strict';

var spawn = require('child_process').spawn,
	EventEmitter = require('events').EventEmitter,
	inherits = require('util').inherits;

function BaseScm(config) {
	var self = this;
	self.config = config;
	['src'].forEach(function(key) {
		if (key in self.config === false) throw new Error(key + ' is not set');
		self[key] = self.config[key];
	});
	self.cwd = config.cwd;
}

module.exports = BaseScm;

inherits(BaseScm, EventEmitter);

BaseScm.prototype._exec = function(command, args, callback) {
	var self = this,
		stdout = '';
	var cmd = spawn(command, args, {cwd: this.cwd});
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
		)
		callback(err, stdout);
	});
	return cmd;
};

/**
 * Clone repository to the `dst` update to `rev` and  set `this.cwd` to `dst`
 */
BaseScm.prototype.clone = function(dst, rev, callback) {
};

/**
 * Pull changes from remote repository without update
 */
BaseScm.prototype.pull = function(rev, callback) {
};

/**
 * Returns string id of current revision
 */
BaseScm.prototype.getId = function(callback) {
};

/**
 * Returns array of changes between revisions
 */
BaseScm.prototype.getChanges = function(rev1, rev2, callback) {
};

/**
 * Updates to revision
 */
BaseScm.prototype.update = function(rev, callback) {
};

