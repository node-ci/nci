'use strict';

define([
	'react',
	'app/components/projects/index',
	'app/components/builds/index',
	'app/components/console/index',
	'templates/app/components/app'
], function(React, Projects, Builds, Console, template) {
	var Component = React.createClass({
		render: function() {
			return template({
				ProjectsList: Projects.List,
				BuildsList: Builds.List,
				Console: Console.Console
			});
		}
	});

	return Component;
});
