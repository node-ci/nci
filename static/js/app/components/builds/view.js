'use strict';

define([
	'react',
	'reflux',
	'app/actions/build',
	'app/stores/build',
	'app/components/terminal/terminal',
	'templates/app/components/builds/view',
	'app/components/common/index'
], function(
	React, Reflux, BuildActions, buildStore, TerminalComponent, template,
	CommonComponents
) {
	template = template.locals({
		DateTime: CommonComponents.DateTime,
		Terminal: TerminalComponent
	});

	var Component = React.createClass({
		mixins: [Reflux.ListenerMixin],
		componentDidMount: function() {
			BuildActions.read(Number(this.props.params.id));

			this.listenTo(buildStore, this.updateBuild);
		},
		updateBuild: function(build) {
			if (!this.state.build && build) {
				BuildActions.readTerminalOutput(build);
			}
			this.setState({build: build});
		},
		render: template,
		getInitialState: function() {
			return {
				build: null
			};
		}
	});

	return Component;
});
