'use strict';

var _ = require('underscore'),
	CronJob = require('cron').CronJob;

exports.init = function(app, callback) {

	var logger = app.lib.logger('scheduler'),
		projectJobs = {};

	app.projects.on('projectLoaded', function(project) {
		var time = project.buildEvery && project.buildEvery.time;
		if (time) {
			logger.log(
				'Start job for loaded project "%s" by schedule "%s"',
				project.name,
				time
			);
			projectJobs[project.name] = {};
			projectJobs[project.name].job = new CronJob({
				cronTime: time,
				onTick: function() {
					logger.log('Run project "%s"', project.name);
					app.builds.create({
						projectName: project.name,
						withScmChangesOnly: project.buildEvery.withScmChangesOnly,
						initiator: {type: 'scheduler'}
					});
				},
				start: true
			});
		}
	});

	app.projects.on('projectUnloaded', function(project) {
		if (project.name in projectJobs) {
			logger.log('Stop job for unloaded project "%s"', project.name);
			projectJobs[project.name].job.stop();
			delete projectJobs[project.name];
		}
	});

	callback();
};
