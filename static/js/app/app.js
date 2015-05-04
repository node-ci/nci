'use strict';

define([
	'underscore', 'react', 'socketio', 'dataio', 'jquery'
], function(
	_, React, socketio, dataio, $
) {
	var connect = dataio(socketio.connect());

	var projectsResource = connect.resource('projects'),
		projectsTemplate = _($('#projects-template').html()).template();

	$('#projects').on('click', '.js-projects .js-run', function() {
		var projectName = $(this).parent('.js-project').data('name');
		projectsResource.sync('run', {projectName: projectName}, function(err, result) {
			$('#content').append(err && err.message);
		});
	});

	projectsResource.sync('read', function(err, projects) {
		$('#projects').html(
			(err && err.message) ||
			projectsTemplate({projects: projects})
		);
	});


	var buildsResource = connect.resource('builds'),
		buildsTemplate = _($('#builds-template').html()).template(),
		builds = [];

	$('#builds').on('click', '.js-builds .js-show-console', function() {
		var buildId = $(this).parent('.js-build').data('id'),
			resourceName = 'build' + buildId;

		$('#build-console').prev('h2').html('Build #' + buildId + ' console');
		$('#build-console').html('');

		connect.resource(resourceName).subscribe(function(data) {
			$('#build-console').append('<div>' + data + '</div>');
		});
	});

	buildsResource.subscribe(function(build, action) {
		var oldBuild = _(builds).findWhere({id: build.id});
		if (oldBuild) {
			_(oldBuild).extend(build);
		} else {
			builds.unshift(build);
		}

		$('#builds').html(buildsTemplate({builds: builds}));
	});
});
