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
		linesCount: 0,
		componentDidMount: function() {
			console.log('did mount');
			this.listenTo(terminalStore, this.updateItems);
			var node = this.refs.code.getDOMNode();
			this.initialScrollPosition = node.getBoundingClientRect().top;
		},
		prepareRow: function(row) {
			return ansiUp.ansi_to_html(row.replace('\r', ''));
		},
		prepareOutput: function(output) {
			var self = this;
			return output.map(function(row) {
				return self.prepareRow(row);
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
		makeCodeLineContent: function(line) {
			return '<span class="code-line_counter">' + '</span>' +
				'<div class="code-line_body">' + this.prepareRow(line) + '</div>';
		},
		makeCodeLine: function(line, index) {
			return '<div class="code-line" data-number="' + index + '">' +
				this.makeCodeLineContent(line) + '</div>';
		},
		updateItems: function(build) {
			// listen just our console update
			if (build.buildId === this.props.build) {
				var currentLinesCount = build.data.length,
					terminal = $('.terminal_code'),
					rows = terminal.children();

				if (rows.length) {
					// replace our last node
					var index = this.linesCount - 1;
					$(rows[index]).html(this.makeCodeLineContent(build.data[index]));
				}

				var self = this;
				terminal.append(
					_(build.data.slice(this.linesCount)).map(function(line, index) {
						return self.makeCodeLine(line, self.linesCount + index);
					})
				);

				this.linesCount = currentLinesCount;
			}
		},
		shouldComponentUpdate: function() {
			return false;
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
