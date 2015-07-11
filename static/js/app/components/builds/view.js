'use strict';

define([
	'react',
	'react-router',
	'reflux',
	'app/actions/build',
	'app/stores/build',
	'app/components/terminal/terminal',
	'templates/app/components/builds/view',
	'app/components/common/index'
], function(
	React, Router, Reflux, BuildActions, buildStore, TerminalComponent, template,
	CommonComponents
) {
	template = template.locals({
		DateTime: CommonComponents.DateTime,
		Scm: CommonComponents.Scm,
		Terminal: TerminalComponent,
		Link: Router.Link
	});

	var Component = React.createClass({
		mixins: [Reflux.ListenerMixin],
		statics: {
			willTransitionTo: function(transition, params, query) {
				BuildActions.read(Number(params.id));
			}
		},
		componentDidMount: function() {
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
