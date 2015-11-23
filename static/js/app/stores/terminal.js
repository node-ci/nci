'use strict';

define([
	'underscore', 'reflux', 'app/actions/build', 'app/connect'
], function(
	_, Reflux, BuildActions, connect
) {
	var Store = Reflux.createStore({
		listenables: BuildActions,

		init: function() {
			// the only purpose of this hash to reconnect all the time
			// except first, see notes at using
			this.connectedResourcesHash = {};
		},

		transformData: function(data) {
			var splittedData  = data.text.split('\n');

			if (this.currentLine) {
				this.lines.pop();
			}

			this.currentLine += _(splittedData).first();
			this.lines.push(this.currentLine);

			if (splittedData.length > 1) {
				if (_(splittedData).last() === '') {
					this.currentLine = '';
					splittedData = _(splittedData.slice(1)).initial();
				} else {
					this.currentLine = _(splittedData).last();
					splittedData = _(splittedData).tail();
				}
				this.lines = this.lines.concat(splittedData);
			}

			return this.lines;
		},

		onReadTerminalOutput: function(build) {
			var self = this,
				output = [],
				resourceName = 'build' + build.id;

			var connectToBuildDataResource = function() {
				// reconnect for get data below (at subscribe), coz
				// data emitted only once during connect
				if (self.connectedResourcesHash[resourceName]) {
					connect.resource(resourceName).reconnect();
				} else {
					self.connectedResourcesHash[resourceName] = 1;
				}

				connect.resource(resourceName).subscribe('data', function(data) {
					self.trigger({
						buildId: build.id,
						name: 'Console for build #' + build.id,
						data: self.transformData(data)
					});
				});
			};

			this.lines = [];
			this.currentLine = '';

			// create data resource for completed build
			if (build.completed) {
				connect.resource('projects').sync(
					'createBuildDataResource',
					{buildId: build.id},
					function(err) {
						if (err) throw err;
						connectToBuildDataResource();
					}
				);
			} else {
				connectToBuildDataResource();
			}
		}
	});

	return Store;
});
