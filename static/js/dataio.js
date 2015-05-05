'use strict';

define(['_dataio'], function(dataio) {
	return function(socket) {
		var connect = dataio(socket);

		/*
		 * Extend resource
		 */
		var resource = connect.resource('__someResource__'),
			resourcePrototype = Object.getPrototypeOf(resource);

		resourcePrototype.unsubscribeAll = function() {
			this.socket.removeAllListeners();
		};

		return connect;
	};
});