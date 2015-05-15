'use strict';

define([
	'underscore',
	'reflux', 'app/actions/build', 'app/resources'
], function(_, Reflux, BuildActions, resources) {
	var resource = resources.builds;

	var Store = Reflux.createStore({
		listenables: BuildActions,
		builds: [],

		onChange: function(data, action) {
			var oldBuild = _(this.builds).findWhere({id: data.buildId});
			if (oldBuild) {
				_(oldBuild).extend(data.changes);
			} else {
				this.builds.unshift(
					_({id: data.buildId}).extend(data.changes)
				);
			}

			this.trigger(this.builds);
		},

		init: function() {
			resource.subscribe('change', this.onChange);
		},

		onReadAll: function() {
			var self = this;
			resource.sync('read', function(err, builds) {
				if (err) throw err;
				self.builds = builds;
				self.trigger(self.builds);
			});
		}
	});

	return Store;
});
