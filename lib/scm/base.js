'use strict';

var EventEmitter = require('events').EventEmitter,
	inherits = require('util').inherits,
	_ = require('underscore');

function Scm(params) {
	var self = this;

	EventEmitter.call(self);

	self.repository = params.repository;
	self.cwd = params.cwd;

	if (!self.repository && !self.cwd) {
		throw new Error('`repository` or `cwd` must be set');
	}

	self.command = params.command;

	if (!self.command) throw new Error('`command` is required');

	self.command.setParams({
		collectOut: true,
		emitIn: true,
		attachStderr: true
	});

	self.command.on('stdin', function(data) {
		self.emit('stdin', data);
	});
}

exports.Scm = Scm;

inherits(Scm, EventEmitter);

Scm.prototype._run = function(params, callback) {
	if (this.cwd) {
		params.options = params.options || {};
		params.options.cwd = this.cwd;
	}

	this.command.run(params, callback);
};

/**
 * Clone repository to the `dst` update to `rev` and  set `this.cwd` to `dst`
 */
/* istanbul ignore next */
Scm.prototype.clone = function(dst, rev, callback) {
};

/**
 * Pull changes from remote repository without update
 */
/* istanbul ignore next */
Scm.prototype.pull = function(rev, callback) {
};

/**
 * Returns info (in changes format) about current revision
 */
/* istanbul ignore next */
Scm.prototype.getCurrent = function(callback) {
};

/**
 * Returns array of changes between revisions
 */
/* istanbul ignore next */
Scm.prototype.getChanges = function(rev1, rev2, callback) {
};

/**
 * Returns info (in changes format) about target revision
 */
Scm.prototype.getRev = function(rev, callback) {
	this.getChanges(rev, rev, function(err, changes) {
		callback(err, !err && changes[0]);
	});
};

/**
 * Updates to revision and throw away all local changes
 */
/* istanbul ignore next */
Scm.prototype.update = function(rev, callback) {
};

