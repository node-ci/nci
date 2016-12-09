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

	this.reservedExecutorsSequence = 1;
	this.reservedExecutorsHash = {};

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

	// check for permanent wait reasons first

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
	}

	// check temp reasons only if it's full check (not for changes only)

	if (!params.checkForScmChangesOnly) {
		if (this.executors.length >= this.maxExecutorsCount) {
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
	}

	return waitReason;
};

Node.prototype.hasFreeExecutor = function(project, params) {
	return !this.getExecutorWaitReason(project, params);
};

Node.prototype.getFreeExecutorsCount = function() {
	return this.maxExecutorsCount - this.executors.length;
};

Node.prototype.hasScmChanges = function(project, params, callback) {
	var self = this;

	// fallback for old signature when only project and callback were passed
	// TODO: remove that fallback on next minor release
	if (_(params).isFunction()) {
		callback = params;
		params = {};
	}

	Steppy(
		function() {
			self._createExecutor(
				_({project: project}).defaults(params)
			).hasScmChanges(this.slot());
		},
		callback
	);
};

Node.prototype.reserveExecutor = function(project, params) {
	var waitReason = this.getExecutorWaitReason(project, params);
	if (waitReason) {
		throw new Error(
			'Project "' + project.name + '" should wait because: ' + waitReason
		);
	}

	var executor = this._createExecutor(
		_({project: project}).defaults(params)
	);
	this.executors.push(executor);

	var executorId = this.reservedExecutorsSequence++;
	this.reservedExecutorsHash[executorId] = executor;

	return executorId;
};

Node.prototype._releaseExecutor = function(executor) {
	var executorIndex = _(this.executors).findIndex(executor);
	this.executors.splice(executorIndex, 1);
};

Node.prototype.releaseExecutor = function(executorId) {
	var executor = this.reservedExecutorsHash[executorId];

	if (!executor) {
		return null;
	}

	delete this.reservedExecutorsHash[executorId];

	this._releaseExecutor(executor);
};

Node.prototype.runExecutor = function(executorId, executorParams, callback) {
	var self = this,
		executor = self.reservedExecutorsHash[executorId];

	if (!executor) {
		return callback(new Error(
			'Can`t fine reserved executor with id: ' + executorId
		));
	}

	// drop from hash early to prevent possible duplicate run
	delete self.reservedExecutorsHash[executorId];

	executor.setParams(executorParams);

	// run executor on next tick to return it asap, needed to been able
	// to listen all executor run events
	process.nextTick(function() {
		executor.run(function(err) {
			self._releaseExecutor(executor);

			callback(err);
		});
	});

	return executor;
};

Node.prototype.run = function(project, params, callback) {

	var executorId, reserveExecutorError;

	try {
		executorId = this.reserveExecutor(project, params);
	} catch(err) {
		reserveExecutorError = err;
	}

	if (reserveExecutorError) {
		return callback(reserveExecutorError);
	}

	return this.runExecutor(executorId, {}, callback);
};