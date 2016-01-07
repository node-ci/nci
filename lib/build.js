'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	EventEmitter = require('events').EventEmitter,
	inherits = require('util').inherits;

/**
 * Facade entity which accumulates operations with currently running and
 * db saved builds.
 */
function BuildsCollection(params) {
	this.db = params.db;
	this.distributor = params.distributor;

	this._proxyDistributorEvent('buildUpdate', 'buildUpdated');
	this._proxyDistributorEvent('buildCancel', 'buildCanceled');
	this._proxyDistributorEvent('buildLogLines', 'buildLogLines');
}

exports.BuildsCollection = BuildsCollection;

inherits(BuildsCollection, EventEmitter);

BuildsCollection.prototype._proxyDistributorEvent = function(source, dest) {
	var self = this;

	self.distributor.on(source, function() {
		self.emit.apply(self, [dest].concat(_(arguments).toArray()));
	});
};

BuildsCollection.prototype.create = function(params, callback) {
	this.distributor.run(params, callback);
};

BuildsCollection.prototype.cancel = function(params, callback) {
	this.distributor.cancel(params, callback);
};

BuildsCollection.prototype.get = function(id, callback) {
	this.find({start: {id: id}}, function(err, builds) {
		callback(err, builds && builds[0]);
	});
};

BuildsCollection.prototype.find = function(params, callback) {
	this.db.builds.find(params, callback);
};

BuildsCollection.prototype.getLogLines = function(params, callback) {
	var self = this;

	Steppy(
		function() {
			var findParams = {
				start: {buildId: params.buildId},
				end: {buildId: params.buildId}
			};
			if (params.from) findParams.start.number = params.from;
			if (params.to) findParams.end.number = params.to;

			var count = params.from && params.to ? params.to - params.from + 1: 0;

			self.db.logLines.find(findParams, this.slot());

			this.pass(count);
		},
		function(err, logLines, count) {
			this.pass({
				lines: logLines,
				isLast: count ? logLines.length < count : true
			});
		},
		callback
	);	
};

BuildsCollection.prototype.getLogLinesTail = function(params, callback) {
	var self = this;

	Steppy(
		function() {
			var findParams = {
				reverse: true,
				start: {buildId: params.buildId},
				limit: params.limit
			};

			self.db.logLines.find(findParams, this.slot());
		},
		function(err, logLines) {
			var lines = logLines.reverse(),
				total = logLines.length ? logLines[logLines.length - 1].number : 0;

			this.pass({lines: lines, total: total});
		},
		callback
	);	
};

/**
 * Calculate average build duration (in ms) for the given project.
 *
 * @param {String} params.projectName
 * @param {Number} [params.buildsCount]
 * @param {Function} callback(err,duration)
 */
BuildsCollection.prototype.getProjectAvgBuildDuration = function(params, callback) {
	params.buildsCount = params.buildsCount || 10;
	var self = this;

	Steppy(
		function() {
			// get last done builds to calc avg build time
			self.db.builds.find({
				start: {
					projectName: params.projectName,
					status: 'done',
					descCreateDate: ''
				},
				limit: params.buildsCount
			}, this.slot());
		},
		function(err, doneBuilds) {
			var durationsSum = _(doneBuilds).reduce(function(memo, build) {
				return memo + (build.endDate - build.startDate);
			}, 0);

			this.pass(Math.round(durationsSum / doneBuilds.length));
		},
		callback
	);
};
