'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	logger = require('../logger')('notifier'),
	BaseNotifierTransport = require('./transport/base').Transport,
	ConsoleNotifierTransport = require('./transport/console').Transport;

var constructors = {
	console: ConsoleNotifierTransport
};

exports.register = function(type, constructor) {
	constructors[type] = constructor;
};

exports.BaseNotifierTransport = BaseNotifierTransport;


function Notifier(params) {
	this.db = params.db;

	this.instances = {};
}

exports.Notifier = Notifier;

Notifier.prototype.init = function(params, callback) {
	var self = this;

	Steppy(
		function() {
			var initGroup = this.makeGroup();
			_(constructors).each(function(Constructor, type) {
				self.instances[type] = new Constructor();
				self.instances[type].init(params[type], initGroup.slot());
			});
		},
		callback
	);
};

// Returns previous (by number) build from the same project
Notifier.prototype._getPrevBuild = function(build, callback) {
	var self = this;

	Steppy(
		function() {
			var envName = build.env && build.env.name;

			// get id of prev build
			self.db.builds.find({
				start: {
					projectName: build.project.name,
					descCreateDate: ''
				},
				filter: function(prevBuild) {
					var prevEnvName = prevBuild.env && prevBuild.env.name;

					return (
						(prevBuild.id < build.id) &&
						(!envName || envName === prevEnvName)
					);
				},
				limit: 1
			}, this.slot());
		},
		function(err, builds) {
			if (builds.length) {
				this.pass(builds[0]);
			} else {
				this.pass(null);
			}
		},
		callback
	);
};

/*
 * Check if that's completed build should be notified, then notify
 */
Notifier.prototype.send = function(build, callback) {
	callback = callback || function(err) {
		if (err) {
			logger.error('Error during send:', err.stack || err);
		}
	};
	var self = this;

	Steppy(
		function() {
			var notify = build.project.notify;

			// TODO: move to project validation during load
			if (!notify || !notify.on || !notify.to) {
				return callback();
			}

			this.pass(notify);

			// get previous build (for some strategies)
			if (_(notify.on).intersection(['change', 'fix']).length) {
				self._getPrevBuild(build, this.slot());
			} else {
				this.pass(null);
			}
		},
		function(err, notify, prevBuild) {
			var strategy = _(notify.on).find(function(strategy) {
				if (strategy === 'started') {
					return build.status === 'in-progress';
				} else if (strategy === 'done') {
					return build.status === 'done';
				} else if (strategy === 'error') {
					return build.status === 'error';
				} else if (strategy === 'canceled') {
					return build.status === 'canceled';
				} else if (strategy === 'change') {
					// notify on status change or about first build
					return prevBuild ? build.status !== prevBuild.status: true;
				} else if (strategy === 'fix') {
					// notify on fix or about first build if it's correct
					if (prevBuild) {
						return prevBuild.status === 'error' && build.status === 'done';
					} else {
						return build.status === 'done';
					}
				}
			});

			// Nothing to notify about
			if (!strategy) {
				return callback();
			}

			var notifyGroup = this.makeGroup();
			_(notify.to).each(function(recipients, type) {
				logger.log(
					'Notify about ' + build.project.name + ' build #' +
					build.number + ' "' + strategy + '" via ' + type
				);
				if (type in self.instances) {
					self.instances[type].send({
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
