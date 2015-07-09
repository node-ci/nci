'use strict';

define([
	'react',
	'react-router',
	'templates/app/index',
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
		Route({name: 'index', path: '/'},
			Route({name: 'dashboard', path: '/', handler: Components.App}),
			Route({
				name: 'projects',
				path: 'projects/:name',
				handler: Components.Project.View
			}),
			Route({name: 'build', path: 'builds/:id', handler: Components.Build.View})
		)
	);

	Router.run(routes, Router.HistoryLocation, function(Handler) {
		React.render(
			template({Component: Handler, Header: Components.Header}),
			document.getElementById('content')
		);
	});

});
