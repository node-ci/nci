'use strict';

define([
	'react',
	'react-router',
	'app/actions/project',
	'app/components/header/index',
	'templates/app/components/app/index'
], function(React, Router, ProjectActions, Header, template) {
	template = template.locals({
		Link: Router.Link,
		Header: Header,
		RouteHandler: Router.RouteHandler
	});

	var Component = React.createClass({
		componentWillMount: function() {
			ProjectActions.readAll();
		},
		render: template
	});

	return Component;
});
