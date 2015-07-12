'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	createBuildDataResource = require('../distributor').createBuildDataResource,
	logger = require('../lib/logger')('projects resource');

module.exports = function(app) {

	var resource = app.dataio.resource('projects'),
		distributor = app.distributor;

	resource.use('createBuildDataResource', function(req, res) {
		createBuildDataResource(req.data.buildId);
		res.send();
	});

	resource.use('readAll', function(req, res) {
		res.send(app.projects);
	});

	resource.use('read', function(req, res) {
		res.send(_(app.projects).findWhere(req.data));
	});

	resource.use('run', function(req, res) {
		var projectName = req.data.projectName;
		logger.log('Run the project: "%s"', projectName);
		distributor.run({
			projectName: projectName,
			initiator: {type: 'user'}
		});
		res.send();
	});

	return resource;
};
