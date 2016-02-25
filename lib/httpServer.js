'use strict';

var http = require('http'),
	inherits = require('util').inherits;

function Server() {
	var self = this;

	self.requestListeners = [];

	return http.Server.call(self, function(req, res) {
		self._processRequestListeners(req, res, 0);
	});
}

inherits(Server, http.Server);

Server.prototype.addRequestListener = function(requestListener) {
	this.requestListeners.push(requestListener);
};

Server.prototype._processRequestListeners = function(req, res, index) {
	var self = this;

	self.requestListeners[index](req, res, function(err) {
		if (err) {
			self.emit('error', err, req, res);
		} else {
			index++;
			if (self.requestListeners[index]) {
				self._processRequestListeners(req, res, index);
			}
		}
	});
};

exports.create = function() {
	return new Server();
};
