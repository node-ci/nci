'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	project = require('../lib/project'),
	Distributor = require('../lib/distributor').Distributor,
	db = require('../db'),
	path = require('path'),
	fs = require('fs');

module.exports = function(app) {

	var projects, projectsHash;

	project.loadAll(app.config.paths.projects, function(err, loadedProjects) {
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
		}
	});

	var getBuildDataFilePath = function(build) {
		return path.join(app.config.paths.builds, build.id + '.log');
	};

	distributor.on('buildUpdate', function(build, changes) {
		var buildsResource = app.dataio.resource('builds');

		if (build.status === 'queued') {
			// create resource for build data
			var buildDataResource = app.dataio.resource('build' + build.id);
			buildDataResource.on('connection', function(client) {
				var callback = this.async();
				fs.createReadStream(getBuildDataFilePath(build), {encoding: 'utf8'})
					.on('data', function(data) {
						client.emit('sync', 'data', data);
					})
					.on('end', callback)
					.on('error', function(err) {
						console.log(err.stack || err);
					});
			});
		}

		buildsResource.clientEmitSync('change', {
			buildId: build.id, changes: changes
		});
	});

	var writeStreamsHash = {};

	distributor.on('buildData', function(build, data) {
		if (!/\n$/.test(data)) {
			data += '\n';
		}

		var filePath = getBuildDataFilePath(build);
		writeStreamsHash[filePath] = (
			writeStreamsHash[filePath] ||
			fs.createWriteStream(getBuildDataFilePath(build), {encoding: 'utf8'})
		);
		// TODO: close ended files
		writeStreamsHash[filePath]
			.on('error', function(err) {
				console.log(err.stack || err);
			})
			.write(data);

		app.dataio.resource('build' + build.id).clientEmitSync('data', data);
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
