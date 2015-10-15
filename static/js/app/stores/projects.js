'use strict';

define([
	'reflux', 'app/actions/project', 'app/resources'
], function(Reflux, ProjectActions, resources) {
	var resource = resources.projects;

	var Store = Reflux.createStore({
		listenables: ProjectActions,
		onRun: function(projectName) {
			resource.sync('run', {projectName: projectName}, function(err) {
				if (err) throw err;
			});
		},
		onReadAll: function(params) {
			var self = this;
			resource.sync('readAll', params, function(err, projects) {
				if (err) throw err;
				self.trigger(projects);
			});
		}
	});

	return Store;
});
