'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	project = require('../lib/project'),
	Distributor = require('../lib/distributor').Distributor,
	db = require('../db'),
	path = require('path'),
	fs = require('fs');

module.exports = function(app) {

	var resource = app.dataio.resource('projects');

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
		nodes: app.config.nodes,
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

	var getBuildLogPath = function(buildId) {
		return path.join(app.config.paths.builds, buildId + '.log');
	};

	var buildDataResourcesHash = {};

	// create resource for build data
	var createBuildDataResource = function(build) {
		if (build.id in buildDataResourcesHash) {
			return;
		}
		var buildDataResource = app.dataio.resource('build' + build.id);
		buildDataResource.on('connection', function(client) {
			var callback = this.async();
			var stream = fs.createReadStream(
				getBuildLogPath(build.id),
				{encoding: 'utf8'}
			);
			stream
				.on('readable', function() {
					var data = stream.read();
					while (data) {
						client.emit('sync', 'data', data);
						data = stream.read();
					}
				})
				.on('end', callback)
				.on('error', function(err) {
					console.log(err.stack || err);
				});
		});
		buildDataResourcesHash[build.id] = buildDataResource;
	};

	distributor.on('buildUpdate', function(build, changes) {
		var buildsResource = app.dataio.resource('builds');

		if (build.status === 'queued') {
			// remove prev log if it exists - for development
			fs.unlink(getBuildLogPath(build.id));
			createBuildDataResource(build);
		}

		buildsResource.clientEmitSync('change', {
			buildId: build.id, changes: changes
		});
	});

	resource.use('createBuildDataResource', function(req, res) {
		createBuildDataResource({id: req.data.id});
		res.send();
	});

	var writeStreamsHash = {};

	distributor.on('buildData', function(build, data) {
		if (!/\n$/.test(data)) {
			data += '\n';
		}

		var filePath = getBuildLogPath(build.id);
		writeStreamsHash[filePath] = (
			writeStreamsHash[filePath] ||
			fs.createWriteStream(getBuildLogPath(build.id), {encoding: 'utf8'})
		);
		// TODO: close ended files
		writeStreamsHash[filePath]
			.on('error', function(err) {
				console.log(err.stack || err);
			})
			.write(data);

		app.dataio.resource('build' + build.id).clientEmitSync('data', data);
	});

	resource.use('readAll', function(req, res) {
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
