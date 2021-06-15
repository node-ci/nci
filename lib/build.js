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
}

exports.BuildsCollection = BuildsCollection;

inherits(BuildsCollection, EventEmitter);

BuildsCollection.prototype.setDistributor = function(distributor) {
	this.distributor = distributor;

	this._proxyDistributorEvent('buildUpdated', 'buildUpdated');
	this._proxyDistributorEvent('buildQueued', 'buildQueued');
	this._proxyDistributorEvent('buildStarted', 'buildStarted');
	this._proxyDistributorEvent('buildStatusChanged', 'buildStatusChanged');
	this._proxyDistributorEvent('buildCompleted', 'buildCompleted');
	this._proxyDistributorEvent('buildCanceled', 'buildCanceled');
	this._proxyDistributorEvent('buildLogLines', 'buildLogLines');
	this._proxyDistributorEvent('buildScmUpdated', 'buildScmUpdated');
};

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
 * initiator: {type: 'build', id: 123, number: 10, project: {name: 'project1'}}
 * - `params.buildParams` - params for current build (override project config)
 * - `params.buildParams.scmRev` - target revision for the build
 * - `params.env` - target environment for the build
 *
 * `result` will contain created `builds` if they were created, every build
 * with at least following fields: id, status, completed, project, params,
 * createDate.
 *
 * @param {Object} params
 * @param {Function} [callback(err,result)]
 */
BuildsCollection.prototype.create = function(params, callback) {
	this.distributor.run(params, callback);
};

/**
 * Cancel build by id.
 * Queued or running build can be canceled.
 * - `params.buildId` - id of target build to cancel
 * - `params.canceledBy` - contains information about initiator of cancel,
 * must contain `type` property e.g. when canceled via http api:
 * canceledBy: {type: 'httpApi'}
 *
 * @param {Object} params
 * @param {Function} [callback(err)]
 */
BuildsCollection.prototype.cancel = function(params, callback) {
	// fallback for old signature when only id were passed
	// TODO: remove that fallback on next minor release
	if (!_(params).isObject()) {
		params = {buildId: params};
	}
	this.distributor.cancel(params, callback);
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
 * - `params.filter` - custom filter function which accepts build and returns
 * boolean
 * - `params.limit` - maximum builds count to get
 *
 * @param {Object} params
 * @param {Function} callback(err,builds)
 */
BuildsCollection.prototype.getRecent = function(params, callback) {
	var self = this;

	Steppy(
		function() {
			var findParams = {
				start: {},
				filter: params.filter,
				limit: params.limit
			};

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

// complete uncompleted builds e.g. after server restart
BuildsCollection.prototype.completeUncompleted = function(params, callback) {
	params = params || {};
	var self = this;

	Steppy(
		function() {
			self.db.builds.find({
				start: {descCreateDate: ''},
				limit: 1000
			}, this.slot());
		},
		function(err, lastBuilds) {
			var uncompletedBuilds = _(lastBuilds).filter(function(lastBuild) {
				return !lastBuild.completed;
			});

			var completeGroup = this.makeGroup();

			if (uncompletedBuilds.length) {
				var queuedAndOtherUncompletedBuilds = _(uncompletedBuilds).partition(
					function(uncompletedBuild) {
						return uncompletedBuild.status === 'queued';
					}
				);

				var queuedBuilds = queuedAndOtherUncompletedBuilds[0];
				uncompletedBuilds = queuedAndOtherUncompletedBuilds[1];

				if (queuedBuilds.length) {
					if (params.logger) {
						params.logger.log(
							'Remove queued uncompleted builds: %s',
							_(queuedBuilds).pluck('id').join(', ')
						);
					}

					self.db.builds.del(queuedBuilds, completeGroup.slot());
				}

				if (uncompletedBuilds.length) {
					if (params.logger) {
						params.logger.log(
							'Complete with interrupted error uncompleted ' +
							'in-progress builds: %s',
							_(uncompletedBuilds).pluck('id').join(', ')
						);
					}

					_(uncompletedBuilds).each(function(uncompletedBuild) {
						var endDate = (
							uncompletedBuild.startDate ||
							uncompletedBuild.createDate
						);

						var sumDuration = _(uncompletedBuild.stepTimings).reduce(
							function(sum, timing) {
								return sum + timing.duration;
							},
							0
						) || 0;

						endDate += sumDuration;

						self.db.builds.update(
							{id: uncompletedBuild.id},
							{
								endDate: endDate,
								status: 'error',
								completed: true,
								error: {message: 'interrupted by server restart'}
							},
							completeGroup.slot()
						);
					});
				}
			}
		},
		callback
	);
};
