'use strict';

var Steppy = require('twostep').Steppy,
	path = require('path'),
	_ = require('underscore'),
	EventEmitter = require('events').EventEmitter,
	inherits = require('util').inherits,
	utils = require('../utils');

function Executor(params) {
	this.project = params.project;
	this.cwd = path.join(this.project.dir, 'workspace');
}

exports.Executor = Executor;

inherits(Executor, EventEmitter);

Executor.prototype.throttledEmit = _(function() {
	this.emit.apply(this, arguments);
}).throttle(1500);

Executor.prototype._getSources = function(params, callback) {
};

Executor.prototype._runStep = function(params, callback) {

};

Executor.prototype.run = function(params, callback) {
	var self = this,
		project = _({}).extend(self.project, params);
	Steppy(
		function() {
			self.throttledEmit('currentStep', 'get sources');
			self._getSources(project.scm, this.slot());
		},
		function(err, scmData) {
			self.emit('scmData', scmData);
			var funcs = project.steps.map(function(step, index) {
				return function() {
					self.throttledEmit('currentStep', step.name);
					self._runStep(step, this.slot());
				};
			});
			funcs.push(this.slot());
			Steppy.apply(this, funcs);
		},
		callback
	);
};

// Returns target rev and filtered changes according to `catchRev`
Executor.prototype._getTarget = function(rev, changes) {
	var result = {rev: rev, changes: changes},
		catchRev = this.project.catchRev;

	if (catchRev) {
		// reverse before search
		changes = changes.reverse();

		var index;

		var comment = catchRev.comment;
		if (comment) {
			index = _(changes).findIndex(function(change) {
				if (_(comment).isRegExp()) {
					return comment.test(change.comment);
				} else {
					return comment === change.comment;
				}
			});
		}

		var tag = catchRev.tag;
		if (tag) {
			index = _(changes).findIndex(function(change) {
				if (change.tags) {
					if (_(tag).isRegExp()) {
						return _(change.tags).find(function(changeTag) {
							return tag.test(changeTag);
						});
					} else {
						return _(change.tags).contains(tag);
					}
				}
			});
		}

		if (index !== -1) {
			result.rev = changes[index].id;
			result.changes = changes.slice(0, index + 1);
			result.changes.reverse();
		}

		// reverse back before return
		changes = changes.reverse();
	}

	return result;
};
