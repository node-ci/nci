'use strict';

define([
	'react',
	'react-router',
	'reflux',
	'app/actions/build',
	'app/stores/build',
	'app/components/terminal/terminal',
	'app/components/buildSidebar/index',
	'templates/app/components/builds/view',
	'app/components/common/index'
], function(
	React, Router, Reflux, BuildActions, buildStore, TerminalComponent,
	BuildSidebar, template, CommonComponents
) {
	template = template.locals({
		DateTime: CommonComponents.DateTime,
		Duration: CommonComponents.Duration,
		Scm: CommonComponents.Scm,
		Terminal: TerminalComponent,
		Link: Router.Link,
		BuildSidebar: BuildSidebar
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
		componentWillReceiveProps: function(nextProps) {
			// reset console status when go from build page to another build
			// page (did mount and mount not called in this case)
			if (Number(nextProps.params.id) !== this.state.build.id) {
				this.setState({showConsole: this.getInitialState().showConsole});
			}
		},
		updateBuild: function(build) {
			if (build) {
				BuildActions.readAll({projectName: build.project.name});
			}
			this.setState({build: build});
		},
		render: template,
		getInitialState: function() {
			return {
				build: null,
				showConsole: false
			};
		},
		toggleConsole: function() {
			var consoleState = !this.state.showConsole;
			if (consoleState) {
				BuildActions.readTerminalOutput(this.state.build);
			}
			this.setState({showConsole: consoleState});
		}
	});

	return Component;
});
