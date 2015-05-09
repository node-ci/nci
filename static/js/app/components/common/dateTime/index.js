'use strict';

define([
	'react',
	'templates/app/components/common/dateTime/template'
], function(React, template) {
	var Component = React.createClass({
		propTypes: {
			date: React.PropTypes.instanceOf(Date)
		},
		render: template
	});

	return Component;
});
