'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	createBuildDataResource = require('./helpers').createBuildDataResource,
	logger = require('../lib/logger')('projects resource');

module.exports = function(app) {
	var resource = app.dataio.resource('projects');

	resource.use('createBuildDataResource', function(req, res) {
		createBuildDataResource(app, req.data.buildId);
		res.send();
	});

	resource.use('readAll', function(req, res) {
		var filteredProjects = app.projects.getAll(),
			nameQuery = req.data && req.data.nameQuery;

		if (nameQuery) {
			filteredProjects = app.projects.filter(function(project) {
				return project.name.indexOf(nameQuery) !== -1;
			});
		}

		filteredProjects = _(filteredProjects).sortBy('name');

		res.send(filteredProjects);
	});

	var getProject = function(name, callback) {
		var project;
		Steppy(
			function() {
				project = app.projects.get(name);

				app.builds.getProjectAvgBuildDuration({
					projectName: project.name
				}, this.slot());

				// get last done build
				app.builds.getRecent({
					projectName: project.name,
					status: 'done',
					limit: 1
				}, this.slot());

				app.builds.getDoneStreak({projectName: project.name}, this.slot());
			},
			function(err, avgProjectBuildDuration, lastDoneBuilds, doneBuildsStreak) {
				project.lastDoneBuild = lastDoneBuilds[0];
				project.avgBuildDuration = avgProjectBuildDuration;
				project.doneBuildsStreak = doneBuildsStreak;

				this.pass(project);
			},
			callback
		);
	};

	// resource custom method which finds project by name
	// and emits event about it change to clients
	resource.clientEmitSyncChange = function(name) {
		Steppy(
			function() {
				getProject(name, this.slot());
			},
			function(err, project) {
				resource.clientEmitSync('change', {project: project});
			},
			function(err) {
				console.error(
					'Error during sync project change occurred:',
					err.stack || err
				);
			}
		);
	};

	resource.use('read', function(req, res) {
		Steppy(
			function() {
				getProject(req.data.name, this.slot());
			},
			function(err, project) {
				res.send(project);
			}
		);
	});

	resource.use('run', function(req, res) {
		var projectName = req.data.projectName;
		logger.log('Run the project: "%s"', projectName);
		app.builds.create({
			projectName: projectName,
			initiator: {type: 'user'},
			queueQueued: true
		});
		res.send();
	});

	return resource;
};
