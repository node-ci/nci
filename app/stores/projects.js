'use strict';

var Reflux = require('reflux'),
	ProjectActions = require('../actions/project'),
	resource = require('../resources').projects;

console.log('resource', resource);
var Store = Reflux.createStore({
	listenables: ProjectActions,
	onRun: function(projectName) {
		resource.sync('run', {projectName: projectName}, function(err) {
			if (err) throw err;
		});
	},
	onReadAll: function(params) {
		console.log('on read all in store');
		var self = this;
		resource.sync('readAll', params, function(err, projects) {
			if (err) throw err;
			self.trigger(projects);
		});
	}
});

module.exports = Store;
