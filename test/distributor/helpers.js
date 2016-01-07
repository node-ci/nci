'use strict';

var Node = require('../../lib/node').Node,
	EventEmitter = require('events').EventEmitter,
	ProjectsCollection = require('../../lib/project').ProjectsCollection;


exports.createNodeMock = function(executorRun) {
	return function(params) {
		var node = new Node(params);
		node._createExecutor = function(project) {
			var executor = new EventEmitter();
			executor.project = project;
			executor.run = executorRun;
			return executor;
		};
		return node;
	};
};

exports.createProjectsMock = function(configs) {
	var projects = new ProjectsCollection({});
	projects.configs = configs;
	return projects;
};
