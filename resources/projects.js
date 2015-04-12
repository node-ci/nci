'use strict';

var _ = require('underscore'),
	project = require('../lib/project');

var projects,
	projectConfigs;

project.loadAll('projects', function(err, loadedProjects) {
	if (err) throw err;
	projects = loadedProjects;
	projectConfigs = _(projects).pluck('config');
	console.log('Loaded projects: ', _(projectConfigs).pluck('name'));
});

module.exports = function(data) {
	var resource = data.resource('projects');

	resource.use('read', function(req, res) {
		res.send(projectConfigs);
	});
};
