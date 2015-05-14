'use strict';

define(['_dataio'], function(dataio) {
	return function(socket) {
		var connect = dataio(socket);

		/*
		 * Extend Resource
		 */
		var resource = connect.resource('__someResource__'),
			resourcePrototype = Object.getPrototypeOf(resource);

		resourcePrototype.disconnect = function() {
			this.socket.disconnect();
			this.socket.removeAllListeners();
		};

		resourcePrototype.connect = function() {
			this.socket.connect();
		};

		resourcePrototype.reconnect = function() {
			this.disconnect();
			this.connect();
		};

		return connect;
	};
});