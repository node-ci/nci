'use strict';

function Notifier() {
}

exports.Notifier = Notifier;

Notifier.prototype.init = function(params, callback) {
	callback();
};

/*
 * {Object} params.notifyReson
 * {Object} params.build
 */
Notifier.prototype.send = function(params, callback) {
	callback();
};
