'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	Distributor = require('./lib/distributor').Distributor,
	db = require('./db'),
	logger = require('./lib/logger')('distributor');


exports.create = function(app, callback) {
	var distributor = new Distributor({
		nodes: app.config.nodes,
		projects: app.projects,
		notifier: app.notifier,
		saveBuild: function(build, callback) {
			Steppy(
				function() {
					if (_(build.project).has('avgBuildDuration')) {
						this.pass(null);
					} else {
						app.builds.getRecent({
							projectName: build.project.name,
							status: 'done',
							limit: 10
						}, this.slot());
					}
				},
				function(err, doneBuilds) {
					if (doneBuilds) {
						build.project.avgBuildDuration = (
							app.builds.getAvgBuildDuration(doneBuilds)
						);
					}

					db.builds.put(build, this.slot());
				},
				function() {
					this.pass(build);
				},
				callback
			);
		},
		removeBuild: function(build, callback) {
			Steppy(
				function() {
					db.builds.del([build.id], this.slot());
				},
				callback
			);
		}
	});

	distributor.on('buildLogLines', function(build, lines) {
		// write build logs to db
		db.logLines.put(lines, function(err) {
			if (err) {
				logger.error(
					'Error during write log lines "' + _(lines).pluck('number') +
					'" for build "' + build.id + '":',
					err.stack || err
				);
			}
		});
	});

	callback(null, distributor);
};
