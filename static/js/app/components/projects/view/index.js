'use strict';

define([
	'react', 'reflux',
	'app/actions/project',
	'app/actions/build',
	'app/stores/project',
	'app/components/builds/list',
	'app/components/common/scm/index',
	'templates/app/components/projects/view/index',
	'app/components/common/index',
	'bootstrap/dropdown'
], function(React, Reflux, ProjectActions, BuildActions,
	projectStore, Builds, Scm, template, CommonComponents
) {
	template = template.locals({
		Builds: Builds,
		Scm: Scm,
		DateTime: CommonComponents.DateTime
	});

	return React.createClass({
		mixins: [Reflux.ListenerMixin],
		statics: {
			willTransitionTo: function(transition, params, query) {
				ProjectActions.read({name: params.name});
				BuildActions.readAll({projectName: params.name});
			}
		},
		onBuildProject: function() {
			if (this.state.project.name) {
				console.log(this.state.project.name);
				ProjectActions.run(this.state.project.name);
			}
		},
		componentDidMount: function() {
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
