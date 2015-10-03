'use strict';

define([
	'app/components/projects/index', 'app/components/builds/index',
	'app/components/app/index', 'app/components/header/index',
	'app/components/dashboard/index', 'app/components/buildLog/index'
], function(
	ProjectsComponents, BuildsComponents,
	App, Header,
	Dashboard, BuildLogComponent
) {
	return {
		App: App,
		Header: Header,
		Project: ProjectsComponents,
		Build: BuildsComponents,
		Dashboard: Dashboard,
		BuildLog: BuildLogComponent
	};
});
