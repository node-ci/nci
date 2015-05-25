'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	utils = require('../utils');

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

			var strategy = _(notify.on).find(function(strategy) {
				if (strategy === 'success') {
					return build.status === 'done';
				} else if (strategy === 'fail') {
					return build.status === 'error';
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
