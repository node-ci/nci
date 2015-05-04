'use strict';

define([
	'reflux', 'app/actions/project', 'app/resources'
], function(Reflux, ProjectActions, resources) {
	var Store = Reflux.createStore({
		init: function() {
			this.listenTo(ProjectActions.load, this.load);
			this.listenTo(ProjectActions.readAll, this.readAll);
		},
		load: function(items) {
			this.trigger(items);
		},
		readAll: function() {
			resources.projects.sync('read', function(err, projects) {
				ProjectActions.load(projects)
			});
		}
	});

	return Store;
});
