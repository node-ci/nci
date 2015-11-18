'use strict';

define([
	'react',
	'../terminal',
	'templates/app/components/terminal/test/index'
], function(React, TerminalComponent, template) {
	template = template.locals({
		Terminal: TerminalComponent
	});
	return React.createClass({
		getInitialState: function() {
			return {
				lines: [1, 2, 3]
			};
		},
		render: template
	});
});
