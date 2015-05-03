'use strict';

define([
	'app/components/projects/index',
	'app/components/app',
], function(ProjectsComponents, App) {
	return {
		App: App,
		ProjectsComponents: ProjectsComponents
	};
});
