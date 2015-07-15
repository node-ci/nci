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
					limit: 10
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
			function(err, doneBuilds, doneBuildsStreak) {
				project.lastDoneBuild = doneBuilds[0];

				var durationsSum = _(doneBuilds).reduce(function(memo, build) {
					return memo + (build.endDate - build.startDate);
				}, 0);

				project.avgBuildDuration = Math.round(
					durationsSum / doneBuilds.length
				);

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
