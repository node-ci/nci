'use strict';

define([
	'react', 'templates/app/index', 'app/components/index',
	'app/actions/project'
], function(
	React, template, Components, ProjectActions
) {
	//var projectsTemplate = _($('#projects-template').html()).template();
	//$('#content').on('click', '.js-projects .js-run', function() {
		//var projectName = $(this).parent('.js-project').data('name');
		//projects.sync('run', {projectName: projectName}, function(err, result) {
			//$('#content').append(
				//(err && err.message)
			//);
		//});
	//});

	//projects.sync('read', function(err, projects) {
		//console.log('read complete');
		////$('#content').html(
			////(err && err.message) ||
			////projectsTemplate({projects: projects})
		////);
	//});

	//builds.subscribe(function(data, action) {
		//$('#content').append(action.action + ': ' + JSON.stringify(data));
	//});

	React.render(template({
		App: Components.App
	}), document.getElementById('react-content'));

	ProjectActions.readAll();
});
