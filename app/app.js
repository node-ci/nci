'use strict';

var React = require('react'),
	ReactDOM = require('react-dom'),
	App = require('./components/app'),
	Dashboard = require('./components/dashboard'),
	ProjectView = require('./components/projects/view'),
	BuildView = require('./components/builds/view'),
	connect = require('./connect'),
	resources = require('./resources'),
	Router = require('react-router');

var Route = React.createFactory(Router.Route),
	DefaultRoute = React.createFactory(Router.DefaultRoute);

var routes = (
	Route({handler: App},
		Route({
			name: 'dashboard',
			path: '/',
			handler: Dashboard
		}),
		Route({
			name: 'project',
			path: 'projects/:name',
			handler: ProjectView
		}),
		Route({name: 'build', path: 'builds/:id', handler: BuildView})
	)
);

connect.io.on('connect', function() {
	Router.run(routes, Router.HistoryLocation, function(Handler) {
		ReactDOM.render(
			React.createElement(Handler),
			document.getElementById('content')
		);
	});
});

