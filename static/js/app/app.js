'use strict';

define([
	'react', 'socketio', 'dataio'
], function(
	React, socketio, dataio
) {
	// console.log(React, socketio, dataio);
	var connect = dataio(socketio.connect());

	var projects = connect.resource('projects');
	projects.sync('read', function(err, projects) {
		console.log('>>> err, projects = ', err, projects)
	});
});
