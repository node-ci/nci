'use strict';

define([
	'underscore', 'react', 'socketio', 'dataio', 'jquery'
], function(
	_, React, socketio, dataio, $
) {
	var connect = dataio(socketio.connect());

	var projects = connect.resource('projects');

	var projectsTemplate = _($('#projects-template').html()).template();
	$('#content').on('click', '.js-projects .js-run', function() {
		var projectName = $(this).parent('.js-project').data('name');
		projects.sync('run', {projectName: projectName}, function(err, result) {
			$('#content').append(
				(err && err.message) ||
				JSON.stringify(result)
			);
		});
	});

	projects.sync('read', function(err, projects) {
		$('#content').html(
			(err && err.message) ||
			projectsTemplate({projects: projects})
		);
	});
});
