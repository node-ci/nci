'use strict';

var React = require('react'),
	ReactDOM = require('react-dom'),
	App = require('./components/app'),
	Dashboard = require('./components/dashboard'),
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
		})
		//Route({
			//name: 'project',
			//path: 'projects/:name',
			//handler: Components.Project.View
		//}),
		//Route({name: 'build', path: 'builds/:id', handler: Components.Build.View}),
		//Route({
			//name: 'buildLog',
			//path: 'builds/:buildId/log',
			//handler: Components.BuildLog
		//})
	)
);

connect.io.on('connect', function() {
	console.log('on connect');
	Router.run(routes, Router.HistoryLocation, function(Handler) {
		ReactDOM.render(
			React.createElement(Handler),
			document.getElementById('content')
		);
	});
});

