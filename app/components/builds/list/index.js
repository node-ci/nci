'use strict';

var _ = require('underscore'),
	React = require('react'),
	Reflux = require('reflux'),
	Item = require('../item'),
	buildsStore = require('../../../stores/builds'),
	template = require('./index.jade');

var Component = React.createClass({
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
	render: template.locals({
		Item: Item
	})
});

module.exports = Component;
