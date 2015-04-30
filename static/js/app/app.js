'use strict';

define([
	'underscore', 'react', 'socketio', 'dataio', 'jquery'
], function(
	_, React, socketio, dataio, $
) {
	var connect = dataio(socketio.connect());

	var projects = connect.resource('projects');
	projects.sync('read', function(err, projects) {
		$('#content').html(
			(err && err.message) ||
			('Loaded projects: ' + _(projects).pluck('name').join(', '))
		);
	});
});
