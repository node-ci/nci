'use strict';

var Node = require('../../lib/node').Node,
	EventEmitter = require('events').EventEmitter;


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

