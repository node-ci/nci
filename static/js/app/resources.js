'use strict';

define([
	'socketio', 'dataio'
], function(socketio, dataio) {
	var connect = dataio(socketio.connect());

	var projects = connect.resource('projects');
	var builds = connect.resource('builds');

	return {
		projects: projects,
		builds: builds
	}
});
