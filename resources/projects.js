'use strict';

var _ = require('underscore'),
	project = require('../lib/project'),
	Distributor = require('../lib/distributor').Distributor;

var projects, projectsHash;

project.loadAll('projects', function(err, loadedProjects) {
	if (err) throw err;
	projects = loadedProjects;
	projectsHash = _(projects).indexBy(function(project) {
		return project.config.name;
	});
	console.log(
		'Loaded projects: ',
		_(projects).chain().pluck('config').pluck('name').value()
	);
});

module.exports = function(app) {

	var distributor = new Distributor({
		nodes: [{type: 'local', maxExecutorsCount: 1}],
		onBuildUpdate: function(build, callback) {
			var buildsResource = app.dataio.resource('builds');
			buildsResource.clientEmitSync(
				build.status === 'waiting' ? 'create' : 'update',
				build
			);
			callback(null, build);
		}
	});

	var resource = app.dataio.resource('projects');

	resource.use('read', function(req, res) {
		res.send(_(projects).pluck('config'));
	});

	resource.use('run', function(req, res) {
		var projectName = req.data.projectName,
			project = projectsHash[projectName];
		console.log('Run the project: %j', project || projectName);
		distributor.run(project.config, {}, function(err, build) {
			console.log('>>> err, build = ', err && err.stack || err, build);
		});
		res.send();
	});

	return resource;
};
