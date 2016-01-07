'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	Distributor = require('./lib/distributor').Distributor,
	db = require('./db'),
	logger = require('./lib/logger')('distributor');


exports.init = function(app, callback) {
	var distributor = new Distributor({
		nodes: app.config.nodes,
		projects: app.projects,
		saveBuild: function(build, callback) {
			Steppy(
				function() {
					if (_(build.project).has('avgBuildDuration')) {
						this.pass(build.project.avgBuildDuration);
					} else {
						app.projects.getAvgBuildDuration(build.project.name, this.slot());
					}
				},
				function(err, avgBuildDuration) {
					build.project.avgBuildDuration = avgBuildDuration;

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
					'Error during write log line "' + logLineNumber +
					'" for build "' + build.id + '":',
					err.stack || err
				);
			}
		});
	});

	callback(null, distributor);
};
