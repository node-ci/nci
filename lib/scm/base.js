'use strict';

var ParentCommand = require('../command/spawn').SpawnCommand,
	inherits = require('util').inherits;

function Scm(params) {
	ParentCommand.call(this, params);
	this.repository = params.repository;
	if (!this.repository && !this.cwd) throw new Error(
		'`repository` or `cwd` must be set'
	);
}

exports.BaseScm = Scm;

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
 * Returns string id of current revision
 */
Scm.prototype.getId = function(callback) {
};

/**
 * Returns array of changes between revisions
 */
Scm.prototype.getChanges = function(rev1, rev2, callback) {
};

/**
 * Updates to revision
 */
Scm.prototype.update = function(rev, callback) {
};

