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
		data: [],
		linesCount: 0,

		componentDidMount: function() {
			this.listenTo(terminalStore, this.updateItems);
			var node = document.getElementsByClassName('terminal')[0];
			this.initialScrollPosition = node.getBoundingClientRect().top;

			$(window).on('scroll', this.onScroll);
		},
		componentWillUnmount: function() {
			$(window).off('scroll', this.onScroll);
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
		onScroll: function() {
			var node = document.getElementsByClassName('terminal')[0],
				body = document.getElementsByTagName('body')[0];
			this.shouldScrollBottom = window.innerHeight + body.scrollTop >=
				node.offsetHeight + this.initialScrollPosition;
		},
		ensureScrollPosition: function() {
			if (this.shouldScrollBottom) {
				var node = document.getElementsByClassName('terminal')[0],
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
		renderBuffer: _.throttle(function() {
			var data = this.data,
				currentLinesCount = data.length,
				terminal = $('.terminal_code'),
				rows = terminal.children();

			if (rows.length) {
				// replace our last node
				var index = this.linesCount - 1;
				$(rows[index]).html(this.makeCodeLineContent(data[index]));
			}

			var self = this;
			terminal.append(
				_(data.slice(this.linesCount)).map(function(line, index) {
					return self.makeCodeLine(line, self.linesCount + index);
				}).join('')
			);

			this.linesCount = currentLinesCount;
			this.ensureScrollPosition();
		}, 100),
		updateItems: function(build) {
			// listen just our console update
			if (build.buildId === this.props.build) {
				this.data = build.data;
				this.renderBuffer();
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
