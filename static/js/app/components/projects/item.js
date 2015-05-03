'use strict';

define([
	'react', 'templates/app/components/projects/item'
], function(React, template) {
	var Component = React.createClass({
		render: function() {
			return template({
				item: this.props.item
			});
		}
	});

	return Component;
});
