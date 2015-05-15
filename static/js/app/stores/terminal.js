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

			var connectToBuildDataResource = function() {
				connect.resource(resourceName).reconnect();
				connect.resource(resourceName).subscribe('data', function(data) {
					output += data;

					self.trigger({
						buildId: build.id,
						name: 'Console for build #' + build.id,
						data: output
					});
				});
			};

			// create data resource for completed build
			if (build.status === 'done' || build.status === 'error') {
				connect.resource('projects')
					.sync('createBuildDataResource', function(err) {
						if (err) throw err;
						connectToBuildDataResource();
					});
			} else {
				connectToBuildDataResource();
			}
		}
	});

	return Store;
});
