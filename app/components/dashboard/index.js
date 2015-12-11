'use strict';

var React = require('react'),
	Router = require('react-router'),
	ProjectActions = require('../../actions/project'),
	BuildActions = require('../../actions/build'),
	BuildsList = require('../builds/list'),
	template = require('./index.jade');

module.exports = React.createClass({
	componentWillMount: function() {
		ProjectActions.readAll();
		BuildActions.readAll();
	},
	render: template.locals({
		Link: Router.Link,
		BuildsList: BuildsList
	})
});
