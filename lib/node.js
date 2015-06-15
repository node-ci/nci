'use strict';

var _ = require('underscore'),
	createExecutor = require('./executor').createExecutor;


function Node(params) {
	this.type = params.type;
	this.maxExecutorsCount = params.maxExecutorsCount;
	this.executors = {};
}

exports.Node = Node;

Node.prototype.getExecutorWaitReason = function(project) {
	var waitReason;

	if (_(this.executors).size() >= this.maxExecutorsCount) {
		waitReason = 'All executors are busy';
	} else if (project.name in this.executors) {
		waitReason = 'Project already running on node';
	}

	return waitReason;
};

Node.prototype.hasFreeExecutor = function(project) {
	return !this.getExecutorWaitReason(project);
};

Node.prototype.getFreeExecutorsCount = function() {
	return this.maxExecutorsCount - _(this.executors).size();
};

Node.prototype._createExecutor = function(project) {
	return createExecutor({
		type: this.type,
		project: project
	});
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
