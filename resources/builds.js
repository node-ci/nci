'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	db = require('../db');

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
				if (data.descCreateDate) {
					start.descCreateDate = data.descCreateDate;
				}

				var findParams = _(data).pick('offset', 'limit');
				findParams.start = start;
				findParams.limit = findParams.limit || 20;

				db.builds.find(findParams, this.slot());
			},
			function(err, builds) {
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

	return resource;
};
