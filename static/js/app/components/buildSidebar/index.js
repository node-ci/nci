'use strict';

define([
	'underscore',
	'react', 'react-router',
	'app/stores/builds', 'reflux',
	'templates/app/components/buildSidebar/index', 'app/components/common/index',
], function(
	_,
	React, Router,
	buildsStore, Reflux,
	template, CommonComponents
) {
	template = template.locals(_({
		Link: Router.Link
	}).extend(CommonComponents));

	return React.createClass({
		mixins: [
			Reflux.connectFilter(buildsStore, 'items', function(items) {
				var projectName = this.props.projectName;
				if (projectName) {
					return _(items).filter(function(item) {
						return item.project && item.project.name === projectName;
					});
				} else {
					return items;
				}
			})
		],
		render: template
	});
});
