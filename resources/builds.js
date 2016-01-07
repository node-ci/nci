'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	logger = require('../lib/logger')('builds resource');

module.exports = function(app) {
	var resource = app.dataio.resource('builds');

	resource.use('readAll', function(req, res, next) {
		Steppy(
			function() {
				var data = req.data || {};

				var start = {};
				if (data.projectName) {
					start.projectName = data.projectName;
				}

				start.descCreateDate = data.descCreateDate || '';

				var findParams = _(data).pick('offset', 'limit');
				findParams.start = start;
				findParams.limit = findParams.limit || 20;

				app.builds.find(findParams, this.slot());
			},
			function(err, builds) {
				// omit big fields not needed for list
				_(builds).each(function(build) {
					delete build.stepTimings;
					if (build.scm) {
						delete build.scm.changes;
					}
					build.project = _(build.project).pick(
						'name', 'scm', 'avgBuildDuration'
					);
				});

				res.send(builds);
			},
			next
		);
	});

	resource.use('read', function(req, res, next) {
		Steppy(
			function() {
				app.builds.get(req.data.id, this.slot());
			},
			function(err, build) {
				res.send(build);
			},
			next
		);
	});

	resource.use('getBuildLogTail', function(req, res, next) {
		Steppy(
			function() {
				app.builds.getLogLinesTail({
					buildId: req.data.buildId,
					limit: req.data.length
				}, this.slot());
			},
			function(err, tail) {
				res.send(tail);
			},
			next
		);
	});

	resource.use('getBuildLogLines', function(req, res, next) {
		Steppy(
			function() {
				app.builds.getLogLines(
					_(req.data).pick('buildId', 'from', 'to'),
					this.slot()
				);
			},
			function(err, logLinesData) {
				res.send(logLinesData);
			},
			next
		);
	});

	resource.use('cancel', function(req, res, next) {
		Steppy(
			function() {
				var buildId = req.data.buildId;
				logger.log('Cancel build: "%s"', buildId);
				app.builds.cancel({buildId: buildId}, this.slot());
			},
			function() {
				res.send();
			},
			next
		);
	});

	return resource;
};
