'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	createBuildDataResource = require('../distributor').createBuildDataResource,
	logger = require('../lib/logger')('projects resource'),
	db = require('../db');

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
		var project;
		Steppy(
			function() {
				project = _(app.projects).findWhere(req.data);

				// get last done builds to calc avg build time
				db.builds.find({
					start: {
						projectName: project.name,
						status: 'done',
						descCreateDate: ''
					},
					limit: 20
				}, this.slot());

				// get last builds to calc current success streak
				var isAllPrevDone = true;
				db.builds.count({
					start: {
						projectName: project.name,
						descCreateDate: ''
					},
					// TODO: find should be implemented at nlevel
					filter: function(build) {
						if (isAllPrevDone && build.status === 'error') {
							isAllPrevDone = false;
						}
						return isAllPrevDone && build.status === 'done';
					}
				}, this.slot());
			},
			function(err, doneBuilds, doneBuildsCount) {
				project.lastDoneBuild = doneBuilds[0];

				var durationsSum = _(doneBuilds).reduce(function(memo, build) {
					return memo + (build.endDate - build.startDate);
				}, 0);

				project.avgBuildDuration = Math.round(
					durationsSum / doneBuilds.length
				);

				project.doneBuildsStreak = doneBuildsCount

				res.send(project);
			}
		);
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
