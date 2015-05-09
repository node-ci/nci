'use strict';

define([
	'react',
	'react-router',
	'templates/app/index', 'app/components/index',
	'app/actions/project', 'app/actions/build'
], function(
	React,
	Router,
	template, Components,
	ProjectActions, BuildActions
) {
	var Route = React.createFactory(Router.Route),
		DefaultRoute = React.createFactory(Router.DefaultRoute);

	var routes = (
		Route({name: 'dashboard', path: '/', handler: Components.App},
			Route({name: 'projects', path: '/projects', handler: Components.ProjectsComponents.List})
		)
	);

	Router.run(routes, Router.HistoryLocation, function(Handler) {
		console.log(Handler);
		React.render(template({
			Component: Handler
		}), document.getElementById('content'));
	});

	ProjectActions.readAll();
	BuildActions.readAll();
});
