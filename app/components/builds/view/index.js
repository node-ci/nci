'use strict';

var _ = require('underscore'),
	React = require('react'),
	Router = require('react-router'),
	Reflux = require('reflux'),
	ProjectActions = require('../../../actions/project'),
	BuildActions = require('../../../actions/build'),
	buildStore = require('../../../stores/build'),
	Terminal = require('../../terminal'),
	BuildSidebar = require('./sidebar'),
	CommonComponents = require('../../common'),
	template = require('./index.jade');

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
		if (build) {
			BuildActions.readAll({projectName: build.project.name});
		}
		this.setState({build: build});
	},
	render: template.locals(_({
		Terminal: Terminal,
		Link: Router.Link,
		BuildSidebar: BuildSidebar
	}).extend(CommonComponents)),
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

module.exports = Component;
