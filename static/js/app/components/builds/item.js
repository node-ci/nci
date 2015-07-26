'use strict';

define([
	'react', 'react-router', 'app/actions/project',
	'app/actions/build', 'templates/app/components/builds/item',
	'app/components/terminal/terminal',
	'app/components/common/index'
], function(
	React, Router, ProjectActions, BuildActions, template,
	TerminalComponent, CommonComponents
) {
	template = template.locals({
		DateTime: CommonComponents.DateTime,
		Duration: CommonComponents.Duration,
		Progress: CommonComponents.Progress,
		Scm: CommonComponents.Scm,
		Terminal: TerminalComponent,
		Link: Router.Link
	});

	var Component = React.createClass({
		getInitialState: function() {
			return {
				showTerminal: false
			};
		},
		onRebuildProject: function(projectName) {
			ProjectActions.run(projectName)
		},
		onShowTerminal: function(build) {
			this.setState({showTerminal: !this.state.showTerminal});
			BuildActions.readTerminalOutput(this.props.build);
		},
		onBuildSelect: function(buildId) {
			console.log('on build select');
		},
		render: template
	});

	return Component;
});
