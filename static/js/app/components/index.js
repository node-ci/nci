'use strict';

define([
	'app/components/projects/index',
	'app/components/builds/index',
	'app/components/app/component',
	'app/components/header/component'
], function(ProjectsComponents, BuildsComponents, App, Header) {
	return {
		App: App,
		Header: Header,
		Project: ProjectsComponents,
		Build: BuildsComponents
	};
});
