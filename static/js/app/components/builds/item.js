'use strict';

define([
	'react', 'app/actions/build', 'templates/app/components/builds/item'
], function(React, BuildActions, template) {
	var Component = React.createClass({
		onBuildSelect: function(buildId) {
			console.log('on build select');
			BuildActions.readConsoleOutput(buildId);
		},
		render: function() {
			return template({
				build: this.props.build,
				onBuildSelect: this.onBuildSelect
			});
		}
	});

	return Component;
});
