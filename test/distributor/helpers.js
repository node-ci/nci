'use strict';

var _ = require('underscore'),
	sinon = require('sinon'),
	createNode = require('../../lib/node').createNode,
	BaseExecutor = require('../../lib/executor').BaseExecutor,
	EventEmitter = require('events').EventEmitter,
	ProjectsCollection = require('../../lib/project').ProjectsCollection,
	Distributor = require('../../lib/distributor').Distributor,
	Notifier = require('../../lib/notifier').Notifier;


var createMockedNode = function(executorParams) {
	return function(params) {
		var node = createNode(params);
		node._createExecutor = function(createExecutorParams) {
			var executor = new BaseExecutor(createExecutorParams);
			executor.run = executorParams.run;
			executor.cancel = executorParams.cancel;
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

var lastBuildId = 0;

exports.createDistributor = function(params) {
	var mockNode = _(params).has('mockNode') ? params.mockNode : true;

	var distributorParams = _({
		saveBuild: function(build, callback) {
			// generate ids for the builds like *down backend does
			if (!build.id) {
				lastBuildId++;
				build.id = lastBuildId;
			}
			callback(null, build);
		}
	}).extend(params);

	if (mockNode) {
		var executorRun = (
			distributorParams.executorRun || sinon.stub().callsArgAsync(0)
		);
		var executorCancel = params.executorCancel;

		// patch method which will be called at constructor
		sinon.stub(Distributor.prototype, '_createNode', createMockedNode({
			run: executorRun,
			cancel: executorCancel
		}));

		delete distributorParams.executorRun;
		delete distributorParams.executorCancel;
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

exports.createExecutorProjectStepError = function(params) {
	var error = new Error(params.message);
	error.projectStepError = true;

	return error;
};
