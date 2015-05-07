'use strict';

define([
	'react', 'templates/app/index', 'app/components/index',
	'app/actions/project'
], function(
	React, template, Components, ProjectActions
) {
	React.render(template({
		App: Components.App
	}), document.getElementById('content'));

	ProjectActions.readAll();
});
