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
	} else if (
		params.env &&
		!_(this.envs).find(function(envName) {
			if (_(envName).isRegExp()) {
				return envName.test(params.env.name);
			} else {
				return params.env.name === envName;
			}
		})
	) {
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
		executor.run(function(err) {
			var executorIndex = _(self.executors).findIndex(executor);
			self.executors.splice(executorIndex, 1);

			callback(err);
		});
	});

	return executor;
};
