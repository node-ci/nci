'use strict';

var React = require('react'),
	_ = require('underscore'),
	template = require('./index.jade');

module.exports = React.createClass({
	render: template,
	_computePercent: function() {
		var build = this.props.build;
		return Math.round((Date.now() - build.startDate) /
										build.project.avgBuildDuration * 100);
	},
	componentDidMount: function() {
		var self = this;
		var updateCallback = function() {
			if (self.props.build.status === 'in-progress') {
				if (self.isMounted()) {
					self.setState({percent: self._computePercent()});
					_.delay(updateCallback, 100);
				}
			}
		};

		updateCallback();
	},
	getInitialState: function() {
		return {
			percent: this._computePercent()
		};
	}
});
