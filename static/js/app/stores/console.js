'use strict';

define([
	'underscore',
	'reflux', 'app/actions/build', 'app/connect'
], function(_, Reflux, BuildActions, connect) {
	var Store = Reflux.createStore({
		listenables: BuildActions,

		output: '',

		init: function() {
			console.log('init builds console output');
		},

		onReadConsoleOutput: function(buildId) {
			this.output = ''

			var resourceName = 'build' + buildId,
				self = this;

			connect.resource(resourceName).unsubscribeAll();
			connect.resource(resourceName).subscribe(function(data) {
				self.output += data;
				self.trigger({
					name: 'Console for build #' + buildId,
					data: data
				});
			});
		}
	});

	return Store;
});
