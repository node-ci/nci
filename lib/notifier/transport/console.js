'use strict';

var BaseTransport = require('./base').Transport,
	inherits = require('util').inherits;

function Transport() {
}

inherits(Transport, BaseTransport);

exports.Transport = Transport;

Transport.prototype.send = function(params, callback) {
	var build = params.build;
	console.log(
		'NOTIFY on %s: build #%s of project %s is %s',
		params.notifyReason.strategy,
		build.number,
		build.project.name,
		build.status
	);
};
