'use strict';

define([
	'react', 'reflux', 'app/actions/project',
	'app/stores/project',
	'templates/app/components/projects/selector/index'
], function(React, Reflux, ProjectActions, projectsStore, template) {
	return React.createClass({
		mixins: [Reflux.ListenerMixin],
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
		updateItems: function(projects) {
			console.log(projects);
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
