'use strict';

define([
	'react',
	'reflux',
	'app/stores/console',
	'templates/app/components/console/console'
], function(React, Reflux, consoleStore, template) {
	var Component = React.createClass({
		mixins: [Reflux.ListenerMixin],
		componentDidMount: function() {
			this.listenTo(consoleStore, this.updateItems);
		},
		updateItems: function(data) {
			this.setState({data: data});
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
