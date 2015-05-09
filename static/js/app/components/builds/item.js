'use strict';

define([
	'react', 'app/actions/project',
	'app/actions/build', 'templates/app/components/builds/item',
	'app/components/common/index'
], function(React, ProjectActions, BuildActions, template, CommonComponents) {
	template = template.locals({
		DateTime: CommonComponents.DateTime
	});
	console.log(CommonComponents.DateTime);

	var Component = React.createClass({
		onRebuildProject: function(projectName) {
			ProjectActions.run(projectName)
		},
		onBuildSelect: function(buildId) {
			console.log('on build select');
			BuildActions.readConsoleOutput(buildId);
		},
		render: template
	});

	return Component;
});
