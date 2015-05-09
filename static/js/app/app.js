'use strict';

define([
	'react', 'templates/app/index', 'app/components/index',
	'app/actions/project', 'app/actions/build'
], function(
	React, template, Components,
	ProjectActions, BuildActions
) {
	React.render(template({
		App: Components.App
	}), document.getElementById('content'));

	ProjectActions.readAll();
	BuildActions.readAll();
});
