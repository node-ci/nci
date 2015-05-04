'use strict';

define([
	'react',
	'app/components/projects/index',
	'templates/app/components/app'
], function(React, Projects, template) {
	var Component = React.createClass({
		render: function() {
			return template({
				ProjectsList: Projects.List
			});
		}
	});

	return Component;
});
