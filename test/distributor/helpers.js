'use strict';

var _ = require('underscore'),
	sinon = require('sinon'),
	createNode = require('../../lib/node').createNode,
	EventEmitter = require('events').EventEmitter,
	ProjectsCollection = require('../../lib/project').ProjectsCollection,
	Distributor = require('../../lib/distributor').Distributor,
	Notifier = require('../../lib/notifier').Notifier;


var createMockedNode = function(executorRun) {
	return function(params) {
		var node = createNode(params);
		node._createExecutor = function(createExecutorParams) {
			var executor = new EventEmitter();
			executor.project = createExecutorParams.project;
			executor.run = executorRun;
			return executor;
		};
		return node;
	};
};

var createProjects = function(configs) {
	var projects = new ProjectsCollection({});
	projects.configs = configs;
	return projects;
};

exports.createDistributor = function(params) {
	var mockNode = _(params).has('mockNode') ? params.mockNode : true;

	var distributorParams = _(params).clone();

	if (mockNode) {
		var executorRun = (
			distributorParams.executorRun || sinon.stub().callsArgAsync(0)
		);
		// patch method which will be called at constructor
		sinon.stub(Distributor.prototype, '_createNode', createMockedNode(
			executorRun
		));
		delete distributorParams.executorRun;
	}

	if (distributorParams.projects) {
		distributorParams.projects = createProjects(distributorParams.projects);
	}
	_(distributorParams).defaults({
		notifier: new Notifier({})
	});

	var distributor = new Distributor(distributorParams);
	distributor.init();

	if (mockNode) {
		Distributor.prototype._createNode.restore();
	}

	return distributor;
};
