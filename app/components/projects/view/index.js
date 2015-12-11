'use strict';

var _ = require('underscore'),
	React = require('react'),
	Reflux = require('reflux'),
	ProjectActions = require('../../../actions/project'),
	BuildActions = require('../../../actions/build'),
	projectStore = require('../../../stores/project'),
	Builds = require('../../builds/list'),
	CommonComponents = require('../../common'),
	template = require('./index.jade');

module.exports = React.createClass({
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
	render: template.locals(
		_({Builds: Builds}).extend(CommonComponents)
	)
});
