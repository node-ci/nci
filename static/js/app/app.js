'use strict';

define([
	'underscore', 'react', 'socketio', 'dataio'
], function(
	_, React, socketio, dataio
) {
	var contentEl = window.document.getElementById('content');

	// console.log(React, socketio, dataio);
	var connect = dataio(socketio.connect());

	var projects = connect.resource('projects');
	projects.sync('read', function(err, projects) {
		contentEl.innerHTML = (
			(err && err.message) ||
			('Loaded projects: ' + _(projects).pluck('name').join(', '))
		);
	});
});
