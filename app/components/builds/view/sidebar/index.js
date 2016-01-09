'use strict';

var _ = require('underscore'),
	React = require('react'),
	Reflux = require('reflux'),
	Router = require('react-router'),
	buildsStore = require('../../../../stores/builds'),
	template = require('./index.jade'),
	CommonComponents = require('../../../common');

module.exports = React.createClass({
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
	render: template.locals(_({
		Link: Router.Link
	}).extend(CommonComponents))
});
