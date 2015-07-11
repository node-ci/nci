'use strict';

define([
	'react',
	'react-router',
	'app/actions/project',
	'app/actions/build',
	'app/components/builds/list',
	'templates/app/components/dashboard/index'
], function(React, Router, ProjectActions, BuildActions, BuildsList, template) {
	template = template.locals({
		Link: Router.Link,
		BuildsList: BuildsList
	});

	var Component = React.createClass({
		componentWillMount: function() {
			ProjectActions.readAll();
			BuildActions.readAll();
		},
		render: template
	});

	return Component;
});
