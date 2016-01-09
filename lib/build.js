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

/**
 * Create build by running given project.
 * - `params.projectName` - project to build
 * - `params.withScmChangesOnly` - if true then build will be started only if
 * there is scm changes for project
 * - `params.queueQueued` - if true then currently queued project can be queued
 * again
 * - `params.initiator` - contains information about initiator of the build,
 * must contain `type` property e.g. when one build triggers another:
 * initiator: {type: 'build', id: 123, number: 10, project: {name: 'project1'}
 *
 * @param {Object} params
 * @param {Function} [callback(err)]
 */
BuildsCollection.prototype.create = function(params, callback) {
	this.distributor.run(params, callback);
};

/**
 * Cancel build by id.
 * Note that only queued build can be canceled currently.
 *
 * @param {Number} id
 * @param {Function} [callback(err)]
 */
BuildsCollection.prototype.cancel = function(id, callback) {
	this.distributor.cancel(id, callback);
};

/**
 * Get build by id.
 *
 * @param {Number} id
 * @param {Function} callback(err,build)
 */
BuildsCollection.prototype.get = function(id, callback) {
	this.db.builds.find({start: {id: id}}, function(err, builds) {
		callback(err, builds && builds[0]);
	});
};

/**
 * Get log lines for the given build.
 * - `params.buildId` - target build
 * - `params.from` - if set then lines from that number will be returned
 * - `params.to` - if set then lines to that number will be returned
 *
 * @param {Object} params
 * @param {Function} callback(err,logLinesData)
 */
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
 * Calculate average build duration for the given builds.
 *
 * @param {Object[]} builds
 */
BuildsCollection.prototype.getAvgBuildDuration = function(builds) {
	var durationsSum = _(builds).reduce(function(sum, build) {
		return sum + (build.endDate - build.startDate);
	}, 0);
	return Math.round(durationsSum / builds.length);
};

/**
 * Get builds sorted by date in descending order.
 * - `params.projectName` - optional project filter
 * - `params.status` - optional status filter, can be used only when
 * `params.projectName` is set. When used builds in the result will contain
 * only following fields: id, number, startDate, endDate
 * - `params.limit` - maximum builds count to get
 *
 * @param {Object} params
 * @param {Function} callback(err,builds)
 */
BuildsCollection.prototype.getRecent = function(params, callback) {
	var self = this;

	Steppy(
		function() {
			var findParams = {start: {}, limit: params.limit};

			// such condition for match one of projections:
			// projectName, descCreateDate
			// projectName, status, descCreateDate
			// or just descCreateDate projection if project name is not set
			if (params.projectName) {
				findParams.start.projectName = params.projectName;
				if (params.status) findParams.start.status = params.status;
			}

			findParams.start.descCreateDate = '';

			self.db.builds.find(findParams, this.slot());
		},
		callback
	);
};

/**
 * Get info about current done builds streak.
 * - `params.projectName` - optional project filter
 *
 * @param {Object} params
 * @param {Function} callback(err,doneStreak)
 */
BuildsCollection.prototype.getDoneStreak = function(params, callback) {
	var self = this;

	Steppy(
		function() {
			var start = {};

			if (params.projectName) start.projectName = params.projectName;

			start.descCreateDate = '';

			// tricky but effective streak counting inside filter goes below
			var doneBuildsStreakCallback = _(this.slot()).once(),
				doneBuildsStreak = {buildsCount: 0};

			self.db.builds.find({
				start: start,
				filter: function(build) {
					// error exits streak
					if (build.status === 'error') {
						doneBuildsStreakCallback(null, doneBuildsStreak);
						return true;
					}
					if (build.status === 'done') {
						doneBuildsStreak.buildsCount++;
					}
				},
				limit: 1
			}, function(err) {
				doneBuildsStreakCallback(err, doneBuildsStreak);
			});
		},
		callback
	);
};