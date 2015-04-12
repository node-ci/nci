'use strict';

var _ = require('underscore'),
	project = require('../lib/project');

var projects;
project.loadAll('projects', function(err, loadedProjects) {
	if (err) throw err;
	projects = loadedProjects;
	console.log('Loaded projects: ', _(projects).map(function(project) {
		return project.config.name;
	}));
});

module.exports = function(data) {
	var projects = [{
		name: 'foo'
	}];
};
