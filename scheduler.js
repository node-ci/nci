'use strict';

var _ = require('underscore'),
	logger = require('./lib/logger')('scheduler'),
	CronJob = require('cron').CronJob;

exports.init = function(app, callback) {

	var distributor = app.distributor,
		projectJobs = {};

	app.on('projectLoaded', function(project) {
		var time = project.buildEvery && project.buildEvery.time;
		if (time) {
			logger.log('Start job for loaded project "%s"', project.name);
			projectJobs[project.name] = {};
			projectJobs[project.name].job = new CronJob({
				cronTime: time,
				onTick: function() {
					logger.log('Run project "%s"', project.name);
					distributor.run({
						projectName: project.name,
						withScmChangesOnly: project.buildEvery.withScmChangesOnly,
						initiator: {type: 'scheduler'}
					});
				},
				start: true
			});
		}
	});

	app.on('projectUnloaded', function(project) {
		if (project.name in projectJobs) {
			logger.log('Stop job for unloaded project "%s"', project.name);
			projectJobs[project.name].job.stop();
			delete projectJobs[project.name];
		}
	});

	callback();
};
