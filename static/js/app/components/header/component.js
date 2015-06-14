'use strict';

define([
	'react',
	'react-router',
	'app/components/projects/selector/index',
	'templates/app/components/header/template'
], function(React, Router, ProjectsSelector, template) {
	template = template.locals({
		Link: Router.Link,
		ProjectsSelector: ProjectsSelector
	});

	var Component = React.createClass({
		render: template
	});

	return Component;
});
