'use strict';

var _ = require('underscore'),
	React = require('react'),
	Reflux = require('reflux'),
	terminalStore = require('../../stores/terminal'),
	ansiUp = require('ansi_up'),
	template = require('./index.jade');

var Component = React.createClass({
	mixins: [Reflux.ListenerMixin],

	shouldScrollBottom: true,
	data: [],
	linesCount: 0,

	componentDidMount: function() {
		this.listenTo(terminalStore, this.updateItems);
		var node = document.getElementsByClassName('terminal')[0];
		this.initialScrollPosition = node.getBoundingClientRect().top;

		window.onscroll = this.onScroll;
	},
	componentWillUnmount: function() {
		window.onscroll = null;
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
	getTerminal: function() {
		return document.getElementsByClassName('terminal')[0];
	},
	getBody: function() {
		return document.getElementsByTagName('body')[0];
	},
	onScroll: function() {
		var node = this.getTerminal(),
			body = this.getBody();

		this.shouldScrollBottom = window.innerHeight + body.scrollTop >=
			node.offsetHeight + this.initialScrollPosition;
	},
	ensureScrollPosition: function() {
		if (this.shouldScrollBottom) {
			var node = this.getTerminal(),
				body = this.getBody();

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
			terminal = document.getElementsByClassName('terminal_code')[0],
			rows = terminal.childNodes;

		if (rows.length) {
			// replace our last node
			var index = this.linesCount - 1;
			rows[index].innerHTML = this.makeCodeLineContent(data[index]);
		}

		var self = this;
		terminal.insertAdjacentHTML('beforeend', 
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
	render: template
});

module.exports = Component;
