'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	utils = require('../utils'),
	db = require('../../db');

var constructors = {},
	instances = {};

exports.register = function(type, constructor) {
	constructors[type] = constructor;
};

exports.init = function(params, callback) {
	Steppy(
		function() {
			var initGroup = this.makeGroup();
			_(constructors).each(function(Constructor, type) {
				instances[type] = new Constructor();
				instances[type].init(params[type], initGroup.slot());
			});
		},
		callback
	);
};

// Returns previous (by number) build from the same project
exports._getPrevBuild = function(build, callback) {
	Steppy(
		function() {
			db.builds.find({
				start: {
					projectName: build.project.name,
					number: build.number - 1
				},
				limit: 1
			}, this.slot());
		},
		function(err, builds) {
			this.pass(builds[0]);
		},
		callback
	);
};

/*
 * Check if that's completed build should be notified, then notify
 */
exports.send = function(build, callback) {
	callback = callback || utils.logErrorCallback;
	Steppy(
		function() {
			if (!build.completed) {
				throw new Error('Build should be completed before notify');
			}

			var notify = build.project.notify;

			// TODO: move to project validation during load
			if (!notify || !notify.on || !notify.to) {
				return callback();
			}

			this.pass(notify);

			// get previous build (for some strategies)
			if (
				build.number > 1 &&
				_(notify.on).intersection(['change']).length
			) {
				exports._getPrevBuild(build, this.slot());
			}
		},
		function(err, notify, prevBuild) {
			var strategy = _(notify.on).find(function(strategy) {
				if (strategy === 'success') {
					return build.status === 'done';
				} else if (strategy === 'fail') {
					return build.status === 'error';
				} else if (strategy === 'change') {
					// notify on status change or about first build
					return prevBuild ? build.status !== prevBuild.status: true;
				}
			});

			// Nothing to notify about
			if (!strategy) {
				return callback();
			}

			var notifyGroup = this.makeGroup();
			_(notify.to).each(function(recipients, type) {
				if (type in instances) {
					instances[type].send({
						build: build,
						notifyReason: {strategy: strategy}
					}, notifyGroup.slot());
				} else {
					throw new Error('Unknown notifier: ' + type);
				}
			});
		},
		callback
	);
};
