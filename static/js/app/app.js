'use strict';

define([
	'react',
	'react-router',
	'templates/app/components/app/index',
	'app/components/index',
	'app/actions/project', 'app/actions/build'
], function(
	React,
	Router,
	template,
	Components,
	ProjectActions, BuildActions
) {
	var Route = React.createFactory(Router.Route),
		DefaultRoute = React.createFactory(Router.DefaultRoute);

	var routes = (
		Route({handler: Components.App},
			Route({name: 'dashboard', path: '/', handler: Components.Dashboard}),
			Route({
				name: 'project',
				path: 'projects/:name',
				handler: Components.Project.View
			}),
			Route({name: 'build', path: 'builds/:id', handler: Components.Build.View}),
			Route({
				name: 'buildLog',
				path: 'builds/:buildId/log',
				handler: Components.BuildLog
			})
		)
	);

	Router.run(routes, Router.HistoryLocation, function(Handler) {
		React.render(
			React.createElement(Handler),
			document.getElementById('content')
		);
	});
});
