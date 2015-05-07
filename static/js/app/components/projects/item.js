'use strict';

define([
	'react', 'app/actions/project', 'templates/app/components/projects/item'
], function(React, ProjectActions, template) {
	var Component = React.createClass({
		onProjectSelect: function(projectName) {
			ProjectActions.run(projectName)
		},
		render: function() {
			return template({
				item: this.props.item,
				onProjectSelect: this.onProjectSelect
			});
		}
	});

	return Component;
});
