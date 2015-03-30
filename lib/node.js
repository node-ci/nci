'use strict';

var _ = require('underscore'),
	createExecutor = require('./executor').createExecutor;


function Node(params) {
	this.type = params.type;
	this.maxExecutorsCount = params.maxExecutorsCount;
	this.executors = {};
}

exports.Node = Node;

Node.prototype.hasFreeExecutor = function(project) {
	return (
		// can't build same project twice at the same time on same node
		project.name in this.executors === false &&
		_(this.executors).size() < this.maxExecutorsCount
	);
}

Node.prototype._createExecutor = function(project) {
	return createExecutor({
		type: this.type,
		project: project
	});
};

Node.prototype.run = function(project, params, callback) {
	var self = this;
	if (!this.hasFreeExecutor(project)) {
		throw new Error('No free executors for project: ' + project.name);
	}

	this.executors[project.name] = this._createExecutor(project);

	this.executors[project.name].run(params, function(err) {
		delete self.executors[project.name];
		callback(err);
	});
};
