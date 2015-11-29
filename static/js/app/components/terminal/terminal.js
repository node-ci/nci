'use strict';

define([
	'underscore',
	'react',
	'reflux',
	'app/stores/terminal',
	'ansi_up',
	'templates/app/components/terminal/terminal',
	'templates/app/components/terminal/row'
], function(_, React, Reflux, terminalStore, ansiUp, template, rowTemplate) {
	var TerminalRow = React.createClass({
		render: rowTemplate,
		shouldComponentUpdate: function(nextProps) {
			return nextProps.row !== this.props.row;
		}
	});

	template = template.locals({
		Row: TerminalRow
	});

	var Component = React.createClass({
		mixins: [Reflux.ListenerMixin],
		shouldScrollBottom: true,
		ignoreScrollEvent: false,
		componentDidMount: function() {
			this.listenTo(terminalStore, this.updateItems);
			var node = this.refs.code.getDOMNode();
			this.initialScrollPosition = node.getBoundingClientRect().top;
		},
		prepareOutput: function(output) {
			return output.map(function(row) {
				return ansiUp.ansi_to_html(row.replace('\r', ''));
			});
		},
		componentWillUpdate: function() {
			var node = this.refs.code.getDOMNode(),
				body = document.getElementsByTagName('body')[0];
			this.shouldScrollBottom = window.innerHeight + body.scrollTop >=
				node.offsetHeight + this.initialScrollPosition;
		},
		componentDidUpdate: function() {
			if (this.shouldScrollBottom) {
				var node = this.refs.code.getDOMNode(),
					body = document.getElementsByTagName('body')[0];
				body.scrollTop = this.initialScrollPosition + node.offsetHeight;
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
