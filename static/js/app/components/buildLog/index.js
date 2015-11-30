'use strict';

define([
	'react', 'reflux', 'app/actions/buildLog', 'app/stores/buildLog',
	'ansi_up', 'underscore', 'templates/app/components/buildLog/index',
	'jquery'
], function(
	React, Reflux, BuildLogActions, buildLogStore,
	ansiUp, _, template,
	$
) {
	var chunkSize = 40;

	return React.createClass({
		mixins: [
			Reflux.connectFilter(buildLogStore, 'data', function(data) {
				data.output = _(data.lines).pluck('text').join('<br>');
				data.output = data.output.replace(
					/(.*)\n/gi,
					'<span class="terminal_code_newline">$1</span>'
				);

				data.output = ansiUp.ansi_to_html(data.output);
				return data;
			})
		],
		statics: {
			willTransitionTo: function(transition, params, query) {
				BuildLogActions.getTail({buildId: params.buildId, length: chunkSize});
			}
		},
		onFromChange: function(event) {
			var from = Number(event.target.value);
			this.setState({from: from});

			BuildLogActions.getLines({
				buildId: this.props.params.buildId,
				from: from,
				to: from + chunkSize - 1
			});
		},
		onVirtualScroll: function(event) {
			this.virtualScrollTop = $(event.target).scrollTop();

			this.setState({virtualScrollTop: this.virtualScrollTop});

			var isDown = this.virtualScrollTop > this.lastVirtualScrollTop;
			var inc = isDown ? 15 : -15;

			var scrollTop = $('.terminal_code').scrollTop(),
				viewHeight = $('.terminal_code').height(),
				contentHeight = $('.terminal_code div:first').height();

			if (
				(isDown && scrollTop + viewHeight + inc < contentHeight) ||
				(!isDown && scrollTop + inc > 0)
			) {
				$('.terminal_code').scrollTop(scrollTop + inc);
			} else {
				var lines = this.state.data.lines,
					line = lines[isDown ? lines.length - 1 : 0],
					from = isDown ? line.number : line.number - chunkSize;

				from = from < 0 ? 1 : from;
				console.log('>>> end = ', line, from);

				BuildLogActions.getLines({
					buildId: this.props.params.buildId,
					from: from,
					to: from + chunkSize - 1
				});
			}

			this.lastVirtualScrollTop = this.virtualScrollTop;
		},
		render: template
	});
});
