'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	Distributor = require('../lib/distributor').Distributor,
	logger = require('../lib/logger')('distributor');


module.exports = function(params, callback) {
	var builds = params.builds,
		db = params.db;

	var distributor = new Distributor({
		nodes: params.config.nodes,
		projects: params.projects,
		notifier: params.notifier,
		saveBuild: function(build, callback) {
			Steppy(
				function() {
					if (_(build.project).has('avgBuildDuration')) {
						this.pass(null);
					} else {
						builds.getRecent({
							projectName: build.project.name,
							status: 'done',
							limit: 10
						}, this.slot());
					}
				},
				function(err, doneBuilds) {
					if (doneBuilds) {
						build.project.avgBuildDuration = (
							builds.getAvgBuildDuration(doneBuilds)
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
