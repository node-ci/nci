'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	db = require('../db'),
	utils = require('../lib/utils'),
	logger = require('../lib/logger')('builds resource');

module.exports = function(app) {
	var resource = app.dataio.resource('builds'),
		distributor = app.distributor;

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

				db.builds.find(findParams, this.slot());
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
				var findParams = {};
				findParams.start = _(req.data).pick('id');
				db.builds.find(findParams, this.slot());
			},
			function(err, build) {
				res.send(build[0]);
			},
			next
		);
	});

	resource.use('getBuildLogTail', function(req, res, next) {
		Steppy(
			function() {
				var findParams = {
					reverse: true,
					start: {buildId: req.data.buildId},
					limit: req.data.length
				};

				db.logLines.find(findParams, this.slot());
			},
			function(err, logLines) {
				var lines = logLines.reverse(),
					total = logLines.length ? logLines[0].number : 0;

				res.send({lines: lines, total: total});
			},
			next
		);
	});

	resource.use('getBuildLogLines', function(req, res, next) {
		Steppy(
			function() {
				var buildId = req.data.buildId,
					from = req.data.from,
					to = req.data.to,
					count = to - from;

				db.logLines.find({
					start: {buildId: buildId, number: from},
					end: {buildId: buildId, number: to}
				}, this.slot());

				this.pass(count);
			},
			function(err, logLines, count) {
				res.send({
					lines: logLines,
					isLast: logLines.length < count
				});
			},
			next
		);
	});

	resource.use('cancel', function(req, res, next) {
		Steppy(
			function() {
				var buildId = req.data.buildId;
				logger.log('Cancel build: "%s"', buildId);
				distributor.cancel({buildId: buildId}, this.slot());
			},
			function() {
				res.send();
			},
			next
		);
	});

	return resource;
};
