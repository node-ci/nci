'use strict';

define([
	'react', 'templates/app/components/common/duration/index'
], function(React, template) {
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
