'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	getAvgProjectBuildDuration =
		require('../lib/project').getAvgProjectBuildDuration,
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

				getAvgProjectBuildDuration(project.name, this.slot());

				// get last done build
				db.builds.find({
					start: {
						projectName: project.name,
						status: 'done',
						descCreateDate: ''
					},
					limit: 1
				}, this.slot());

				// tricky but effective streak counting inside filter goes below
				var doneBuildsStreakCallback = _(this.slot()).once(),
					doneBuildsStreak = 0;

				db.builds.find({
					start: {
						projectName: project.name,
						descCreateDate: ''
					},
					filter: function(build) {
						// error exits streak
						if (build.status === 'error') {
							doneBuildsStreakCallback(null, doneBuildsStreak);
							return true;
						}
						if (build.status === 'done') {
							doneBuildsStreak++;
						}
					},
					limit: 1
				}, function(err) {
					doneBuildsStreakCallback(err, doneBuildsStreak);
				});
			},
			function(err, avgProjectBuildDuration, lastDoneBuilds, doneBuildsStreak) {
				project.lastDoneBuild = lastDoneBuilds[0];
				project.avgBuildDuration = avgProjectBuildDuration;
				project.doneBuildsStreak = doneBuildsStreak;

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
