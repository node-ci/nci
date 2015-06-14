'use strict';

define([
	'react',
	'app/actions/project',
	'app/actions/build',
	'app/components/projects/index',
	'app/components/builds/index',
	'templates/app/components/app/template'
], function(React, ProjectActions, BuildActions, Projects, Builds, template) {
	template = template.locals({
		BuildsList: Builds.List
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
