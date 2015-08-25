'use strict';

define([
	'react', 'templates/app/components/common/duration/index', 'moment'
], function(React, template, moment) {
	template = template.locals({
		moment: moment
	});

	return React.createClass({
		render: template,
		getInitialState: function() {
			var seconds = Math.round(this.props.duration / 1000);

			return {
				minutes: null,
				seconds: seconds
			}
		}
	});
});
