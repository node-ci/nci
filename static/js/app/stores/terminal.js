'use strict';

define([
	'underscore',
	'reflux', 'app/actions/build', 'app/connect'
], function(_, Reflux, BuildActions, connect) {
	var Store = Reflux.createStore({
		listenables: BuildActions,

		init: function() {
			console.log('init builds console output');
		},

		onReadTerminalOutput: function(build) {
			var self = this,
				output = '',
				resourceName = 'build' + build.id;

			connect.resource(resourceName).reconnect();
			connect.resource(resourceName).subscribe('data', function(data) {
				output += data;

				self.trigger({
					buildId: build.id,
					name: 'Console for build #' + build.id,
					data: output
				});
			});
		}
	});

	return Store;
});
