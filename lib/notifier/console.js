'use strict';

var BaseNotifier = require('./base').Notifier,
	inherits = require('util').inherits;

function Notifier() {
}

inherits(Notifier, BaseNotifier);

exports.register = function(app) {
	app.lib.notifier.register('console', Notifier);
};

exports.Notifier = Notifier;

Notifier.prototype.send = function(params, callback) {
	var build = params.build;
	console.log(
		'NOTIFY on %s: build #%s of project %s is %s',
		params.notifyReason.strategy,
		build.number,
		build.project.name,
		build.status
	);
};
