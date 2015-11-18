'use strict';

define([
	'underscore',
	'react',
	'reflux',
	'app/stores/terminal',
	'ansi_up',
	'templates/app/components/terminal/terminal'
], function(_, React, Reflux, terminalStore, ansiUp, template) {
	var Component = React.createClass({
		mixins: [Reflux.ListenerMixin],
		shouldScrollBottom: true,
		ignoreScrollEvent: false,
		componentDidMount: function() {
			this.listenTo(terminalStore, this.updateItems);
		},
		prepareOutput: function(output) {
			return output.map(function(row) {
				return ansiUp.ansi_to_html(row.text);
			});
		},
		componentWillUpdate: function() {
			var node = this.refs.code.getDOMNode();
			this.shouldScrollBottom = node.scrollTop + node.offsetHeight >= node.scrollHeight;
		},
		componentDidUpdate: function() {
			if (this.shouldScrollBottom) {
				var node = this.refs.code.getDOMNode();
				node.scrollTop = node.scrollHeight;
			}
		},
		updateItems: function(build) {
			// listen just our console update
			if (build.buildId === this.props.build) {
				this.setState({data: this.prepareOutput(build.data)});
			}
		},
		render: template,
		getInitialState: function() {
			return {
				data: []
			};
		}
	});

	return Component;
});
