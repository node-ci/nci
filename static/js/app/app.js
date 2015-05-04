'use strict';

define([
	'underscore', 'react', 'socketio', 'dataio', 'jquery'
], function(
	_, React, socketio, dataio, $
) {
	var connect = dataio(socketio.connect());

	var projects = connect.resource('projects'),
		projectsTemplate = _($('#projects-template').html()).template();

	$('#projects').on('click', '.js-projects .js-run', function() {
		var projectName = $(this).parent('.js-project').data('name');
		projects.sync('run', {projectName: projectName}, function(err, result) {
			$('#content').append(err && err.message);
		});
	});

	projects.sync('read', function(err, projects) {
		$('#projects').html(
			(err && err.message) ||
			projectsTemplate({projects: projects})
		);
	});


	var builds = connect.resource('builds'),
		buildsTemplate = _($('#builds-template').html()).template(),
		buildsHash = {};

	$('#builds').on('click', '.js-builds .js-show-console', function() {
		var buildId = $(this).parent('.js-build').data('id'),
			resourceName = 'build' + buildId;;

		$('#build-console').prev('h2').html('Build #' + buildId + ' console');
		$('#build-console').html('');

		connect.resource(resourceName).subscribe(function(data) {
			$('#build-console').append('<div>' + data + '</div>');
		});
	});

	builds.subscribe(function(build, action) {
		buildsHash[build.id] = build;
		$('#builds').html(buildsTemplate({
			builds: _(buildsHash).values().reverse()
		}));
	});
});
