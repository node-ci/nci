'use strict';

var _ = require('underscore');


function Node(params) {
	this.type = params.type;
	this.maxExecutorsCount = params.maxExecutorsCount;
	this.executors = {};
}

exports.Node = Node;

Node.prototype._getBlockerExecutor = function(getBlockers, getTarget) {
	return _(this.executors).find(function(executor) {
		var target = getTarget(executor);
		return _(getBlockers(executor)).find(function(blocker) {
			if (_(blocker).isRegExp()) {
				return blocker.test(target);
			} else {
				return blocker === target;
			}
		});
	})
};

Node.prototype.getExecutorWaitReason = function(project) {
	var waitReason;

	if (_(this.executors).size() >= this.maxExecutorsCount) {
		waitReason = 'All executors are busy';
	} else if (project.name in this.executors) {
		waitReason = 'Project already running on node';
	} else {
		var blockerExecutor;

		if (project.blockedBy) {
			blockerExecutor = this._getBlockerExecutor(
				function(executor) {
					return project.blockedBy;
				},
				function(executor) {
					return executor.project.name;
				}
			);
		}

		if (!blockerExecutor) {
			blockerExecutor = this._getBlockerExecutor(
				function(executor) {
					return executor.project.blocks;
				},
				function(executor) {
					return project.name;
				}
			);
		}

		if (blockerExecutor) {
			waitReason = (
				'Blocked by currently running "' +
				blockerExecutor.project.name + '"'
			);
		}
	}

	return waitReason;
};

Node.prototype.hasFreeExecutor = function(project) {
	return !this.getExecutorWaitReason(project);
};

Node.prototype.getFreeExecutorsCount = function() {
	return this.maxExecutorsCount - _(this.executors).size();
};

Node.prototype.hasScmChanges = function(project, callback) {
	this._createExecutor(project).hasScmChanges(callback);
};

Node.prototype.run = function(project, params, callback) {
	var self = this;

	var waitReason = this.getExecutorWaitReason(project);
	if (waitReason) {
		throw new Error(
			'Project "' + project.name + '" should wait because: ' + waitReason
		);
	}

	this.executors[project.name] = this._createExecutor(project);

	this.executors[project.name].run(params, function(err) {
		delete self.executors[project.name];
		callback(err);
	});

	return this.executors[project.name];
};
