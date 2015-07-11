'use strict';

define([
	'react', 'react-router', 'reflux', 'app/actions/project',
	'app/stores/projects',
	'templates/app/components/projects/selector/index'
], function(React, Router, Reflux, ProjectActions, projectsStore, template) {
	template = template.locals({
		Link: Router.Link
	});

	return React.createClass({
		mixins: [Reflux.ListenerMixin, Router.Navigation],
		componentDidMount: function() {
			this.listenTo(projectsStore, this.updateItems);
		},
		getInitialState: function() {
			return {
				showSearch: false
			};
		},
		onRunProject: function(projectName) {
			ProjectActions.run(projectName)
			this.setState({showSearch: false});
		},
		onSelectProject: function(name) {
			this.transitionTo('projects', {name: name});
		},
		updateItems: function(projects) {
			this.setState({projects: projects});
		},
		onSearchProject: function() {
			this.setState({showSearch: true});
		},
		onInputMount: function(component) {
			var node = React.findDOMNode(component);
			if (node) {
				node.focus();
			}
		},
		onBlurSearch: function() {
			this.setState({showSearch: false});
		},
		onSearchChange: function(event) {
			var query = event.target.value;
			this.setState({searchQuery: query});
			ProjectActions.readAll({nameQuery: query});
		},
		render: template,
	});
});
