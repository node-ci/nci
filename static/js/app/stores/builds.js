'use strict';

define([
	'underscore',
	'reflux', 'app/actions/build', 'app/resources'
], function(_, Reflux, BuildActions, resources) {
	var resource = resources.builds;

	var Store = Reflux.createStore({
		listenables: BuildActions,
		builds: [],

		_onAction: function(build, action) {
			var oldBuild = _(this.builds).findWhere({id: build.id});
			if (oldBuild) {
				_(oldBuild).extend(build);
			} else {
				this.builds.unshift(build);
			}

			this.trigger(this.builds);
		},

		init: function() {
			resource.subscribe('create', 'update', this._onAction);
		},

		onReadAll: function() {
			var self = this;
			resource.sync('read', function(err, builds) {
				self.builds = builds;
				self.trigger(self.builds);
			});
		}
	});

	return Store;
});
