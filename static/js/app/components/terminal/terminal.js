'use strict';

define([
	'react',
	'reflux',
	'app/stores/terminal',
	'templates/app/components/terminal/terminal'
], function(React, Reflux, terminalStore, template) {
	var Component = React.createClass({
		mixins: [Reflux.ListenerMixin],
		componentDidMount: function() {
			this.listenTo(terminalStore, this.updateItems);
		},
		updateItems: function(data) {
			// listen just our console update
			if (data.buildId === this.props.build.id) {
				this.setState({data: data});
			}
		},
		render: function() {
			return template(this.state.data);
		},
		getInitialState: function() {
			return {
				name: '',
				data: ''
			};
		}
	});

	return Component;
});
