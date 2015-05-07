'use strict';

define([
	'app/components/projects/index',
	'app/components/builds/index',
	'app/components/app',
], function(ProjectsComponents, BuildsComponents, App) {
	return {
		App: App,
		ProjectsComponents: ProjectsComponents,
		BuildsComponents: BuildsComponents
	};
});
