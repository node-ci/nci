'use strict';

var ParentCommand = require('../command/spawn').Command,
	inherits = require('util').inherits;

function Scm(params) {
	ParentCommand.call(this, params);
	this.repository = params.repository;
	if (!this.repository && !this.cwd) throw new Error(
		'`repository` or `cwd` must be set'
	);
	this.collectOut = true;
	this.emitIn = true;
	this.attachStderr = true;
}

exports.Scm = Scm;

inherits(Scm, ParentCommand);

/**
 * Clone repository to the `dst` update to `rev` and  set `this.cwd` to `dst`
 */
Scm.prototype.clone = function(dst, rev, callback) {
};

/**
 * Pull changes from remote repository without update
 */
Scm.prototype.pull = function(rev, callback) {
};

/**
 * Returns info (in changes format) about current revision
 */
Scm.prototype.getCurrent = function(callback) {
};

/**
 * Returns array of changes between revisions
 */
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
 * Updates to revision
 */
Scm.prototype.update = function(rev, callback) {
};

