'use strict';

define([
	'reflux', 'app/actions/project', 'app/resources'
], function(Reflux, ProjectActions, resources) {
	var Store = Reflux.createStore({
		init: function() {
			this.listenTo(ProjectActions.readAll, this.readAll);
		},
		readAll: function() {
			var self = this;
			resources.projects.sync('read', function(err, projects) {
				self.trigger(projects);
			});
		}
	});

	return Store;
});
