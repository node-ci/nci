'use strict';

define([
	'react',
	'react-router',
	'templates/app/components/header/template'
], function(React, Router, template) {
	template = template.locals({
		Link: Router.Link
	});

	var Component = React.createClass({
		render: template
	});

	return Component;
});
