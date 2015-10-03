'use strict';

define([
	'reflux', 'app/actions/buildLog', 'app/resources'
], function(
	Reflux, BuildLogActions, resources
) {
	var resource = resources.builds;

	var Store = Reflux.createStore({
		listenables: BuildLogActions,
		data: {
			lines: [],
			total: 0
		},

		getInitialState: function() {
			return this.data;
		},

		onGetTail: function(params) {
			var self = this;
			resource.sync('getBuildLogTail', params, function(err, data) {
				if (err) throw err;
				self.data = data;
				self.trigger(self.data);
			});
		},

		onGetLines: function(params) {
			var self = this;
			resource.sync('getBuildLogLines', params, function(err, data) {
				if (err) throw err;
				self.data.lines = data.lines;
				self.trigger(self.data);
			});
		}
	});

	return Store;
});
