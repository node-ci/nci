'use strict';

define([
	'socketio', 'dataio'
], function(socketio, dataio) {
	// Do it because we use connect in console store
	return dataio(socketio.connect());
});
