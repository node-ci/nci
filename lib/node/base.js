'use strict';

var _ = require('underscore');


function Node(params) {
	this.type = params.type;
	this.maxExecutorsCount = params.maxExecutorsCount;
	this.name = params.name;
	this.usageStrategy = params.usageStrategy || 'maximum';
	this.envs = params.envs;

	if (!this.usageStrategiesHash[this.usageStrategy]) {
		throw new Error('Unknown usage strategy: ' + this.usageStrategy);
	}

	this.executors = {};
}

exports.Node = Node;

Node.prototype.usageStrategiesHash = {maximum: 1, specificProject: 1};

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
	});
};

Node.prototype.getExecutorWaitReason = function(project, params) {
	params = params || {};

	var waitReason;

	var targetNodeNames = project.node && project.node.target;

	if (targetNodeNames && !_(targetNodeNames).isArray()) {
		targetNodeNames = [targetNodeNames];
	}

	if (targetNodeNames && !_(targetNodeNames).contains(this.name)) {
		waitReason = this.name + ': not a target node';
	} else if (this.usageStrategy === 'specificProject' && !targetNodeNames) {
		waitReason = this.name + ': only for specific projects';
	} else if (params.env && !_(this.envs).contains(params.env.name)) {
		waitReason = this.name + ': not a target env';
	} else if (_(this.executors).size() >= this.maxExecutorsCount) {
		waitReason = this.name + ': all executors are busy';
	} else if (project.name in this.executors) {
		waitReason = this.name + ': project already running on node';
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
				this.name + ': blocked by currently running "' +
				blockerExecutor.project.name + '"'
			);
		}
	}

	return waitReason;
};

Node.prototype.hasFreeExecutor = function(project, params) {
	return !this.getExecutorWaitReason(project, params);
};

Node.prototype.getFreeExecutorsCount = function() {
	return this.maxExecutorsCount - _(this.executors).size();
};

Node.prototype.hasScmChanges = function(project, callback) {
	this._createExecutor(project).hasScmChanges(callback);
};

Node.prototype.run = function(project, params, callback) {
	var self = this;

	var waitReason = this.getExecutorWaitReason(project, params);
	if (waitReason) {
		throw new Error(
			'Project "' + project.name + '" should wait because: ' + waitReason
		);
	}

	this.executors[project.name] = this._createExecutor(project);

	// run executor on next tick to return it asap, needed to been able
	// to listen all executor run events
	process.nextTick(function() {
		self.executors[project.name].run(params, function(err) {
			delete self.executors[project.name];
			callback(err);
		});
	});

	return this.executors[project.name];
};
