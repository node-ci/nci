'use strict';

var _ = require('underscore'),
	project = require('../lib/project');

var projects,
	projectConfigs;

project.loadAll('projects', function(err, loadedProjects) {
	if (err) throw err;
	projects = loadedProjects;
	console.log(
		'Loaded projects: ',
		_(projects).chain().pluck('config').pluck('name').value()
	);
});

module.exports = function(data) {
	var resource = data.resource('projects');

	resource.use('read', function(req, res) {
		res.send(_(projects).pluck('config'));
	});
};
