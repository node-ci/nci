'use strict';

define([
	'react', 'app/actions/project',
	'app/actions/build', 'templates/app/components/builds/item',
	'app/components/terminal/terminal',
	'app/components/common/index'
], function(
	React, ProjectActions, BuildActions, template,
	TerminalComponent, CommonComponents
) {
	template = template.locals({
		DateTime: CommonComponents.DateTime,
		Terminal: TerminalComponent
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
