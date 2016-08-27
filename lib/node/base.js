'use strict';

var _ = require('underscore'),
	Steppy = require('twostep').Steppy;


function Node(params) {
	this.type = params.type;
	this.maxExecutorsCount = params.maxExecutorsCount;
	this.name = params.name;
	this.usageStrategy = params.usageStrategy || 'maximum';
	this.envs = params.envs;

	if (!this.usageStrategiesHash[this.usageStrategy]) {
		throw new Error('Unknown usage strategy: ' + this.usageStrategy);
	}

	this.executors = [];
}

exports.Node = Node;

Node.prototype.parallelProjectBuilds = false;

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
	} else if (this.executors.length >= this.maxExecutorsCount) {
		waitReason = this.name + ': all executors are busy';
	} else if (
		!this.parallelProjectBuilds &&
		_(this.executors).find(function(executor) {
			return project.name === executor.project.name;
		})
	) {
		waitReason = this.name + ': project already running on node';
	} else if (
		this.parallelProjectBuilds &&
		params.env &&
		_(this.executors).find(function(executor) {
			return (
				project.name === executor.project.name &&
				executor.env &&
				executor.env.name === params.env.name
			);
		})
	) {
		waitReason = (
			this.name + ': project within "' + params.env.name +
			'" env already running on node'
		);
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
	return this.maxExecutorsCount - this.executors.length;
};

Node.prototype.hasScmChanges = function(project, callback) {
	var self = this;

	Steppy(
		function() {
			self._createExecutor({project: project}).hasScmChanges(this.slot());
		},
		callback
	);
};

Node.prototype.run = function(project, params, callback) {
	var self = this;

	var waitReason = self.getExecutorWaitReason(project, params);
	if (waitReason) {
		return callback(new Error(
			'Project "' + project.name + '" should wait because: ' + waitReason
		));
	}

	var executor, createExecutorError;

	try {
		executor = self._createExecutor(_({project: project}).defaults(params));
		self.executors.push(executor);
	} catch(err) {
		createExecutorError = err;
	}

	if (createExecutorError) {
		callback(createExecutorError);
		return null;
	}

	// run executor on next tick to return it asap, needed to been able
	// to listen all executor run events
	process.nextTick(function() {
		executor.run(params, function(err) {
			var executorIndex = _(self.executors).findIndex(executor);
			self.executors.splice(executorIndex, 1);

			callback(err);
		});
	});

	return executor;
};
