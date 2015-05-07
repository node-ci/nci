'use strict';

define(['app/connect'], function(connect) {
	var projects = connect.resource('projects');
	var builds = connect.resource('builds');

	return {
		projects: projects,
		builds: builds
	}
});
