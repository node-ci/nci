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
		DateTime: CommonComponents.DateTime,
		Duration: CommonComponents.Duration
	});

	return React.createClass({
		mixins: [
			Reflux.connectFilter(projectStore, 'project', function(project) {
				if (project.name === this.props.params.name) {
					return project;
				} else {
					if (this.state) {
						return this.state.project;
					} else {
						return projectStore.getInitialState();
					}
				}
			})
		],
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
		render: template
	});
});
