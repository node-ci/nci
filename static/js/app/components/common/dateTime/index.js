'use strict';

define([
	'react',
	'templates/app/components/common/dateTime/template',
	'moment'
], function(React, template, moment) {
	template = template.locals({
		moment: moment
	});

	var Component = React.createClass({
		render: template
	});

	return Component;
});
