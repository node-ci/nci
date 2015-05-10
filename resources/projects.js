'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	project = require('../lib/project'),
	Distributor = require('../lib/distributor').Distributor,
	db = require('../db');

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
		saveBuild: function(build, callback) {
			Steppy(
				function() {
					db.builds.put(build, this.slot());
				},
				function() {
					this.pass(build);
				},
				callback
			);
		},
		onBuildData: function(build, data) {
			app.dataio.resource('build' + build.id).clientEmitSync('data', data);
		}
	});

	distributor.on('buildUpdate', function(build, changes) {
		var buildsResource = app.dataio.resource('builds');

		if (build.status === 'queued') {
			// create resource for build data
			var buildDataResource = app.dataio.resource('build' + build.id);
			buildDataResource.on('connection', function(client) {
				client.emit('sync', 'data', '< collected data >');
			});
		}

		buildsResource.clientEmitSync('change', {
			buildId: build.id, changes: changes
		});
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
