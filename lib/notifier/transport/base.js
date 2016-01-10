'use strict';

function Transport() {
}

exports.Transport = Transport;

Transport.prototype.init = function(params, callback) {
	callback();
};

/*
 * {Object} params.notifyReson
 * {Object} params.build
 */
Transport.prototype.send = function(params, callback) {
	callback();
};
