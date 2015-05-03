'use strict';

define([
	'react',
	'app/components/projects/index',
	'templates/app/components/app'
], function(React, Projects, template) {
	var Component = React.createClass({
		getInitialState: function() {
			return {
				projects: []
			};
		},
		render: function() {
			return template({
				ProjectsList: Projects.List
			});
		}
	});

	return Component;
});
