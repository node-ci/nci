'use strict';

define([
	'react', 'reflux',
	'app/actions/project',
	'app/actions/build',
	'app/stores/project',
	'app/components/builds/list',
	'templates/app/components/projects/view/index'
], function(React, Reflux, ProjectActions, BuildActions,
	projectStore, Builds, template
) {
	template = template.locals({
		Builds: Builds
	});

	return React.createClass({
		mixins: [Reflux.ListenerMixin],
		componentDidMount: function() {
			ProjectActions.read({name: this.props.params.name});
			BuildActions.readAll({projectName: this.props.params.name});

			this.listenTo(projectStore, this.updateItem);
		},
		updateItem: function(project) {
			this.setState({project: project});
		},
		getInitialState: function() {
			return {
				project: {}
			}
		},
		render: template,
	});
});
