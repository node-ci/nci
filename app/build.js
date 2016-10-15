'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	db = require('./db');

exports.completeUncompleted = function(params, callback) {
	params = params || {};

	Steppy(
		function() {
			db.builds.find({
				start: {descCreateDate: ''},
				limit: 100
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
							'remove queued builds: %s',
							_(queuedBuilds).pluck('id').join(', ')
						);
					}

					db.builds.del(queuedBuilds, completeGroup.slot());
				}

				if (uncompletedBuilds.length) {
					if (params.logger) {
						params.logger.log(
							'complete with interrupt error uncompleted builds: %s',
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

						db.builds.update(
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
