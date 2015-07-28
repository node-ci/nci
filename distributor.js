'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	Distributor = require('./lib/distributor').Distributor,
	getAvgProjectBuildDuration = (
		require('./lib/project').getAvgProjectBuildDuration
	),
	db = require('./db'),
	path = require('path'),
	fs = require('fs'),
	logger = require('./lib/logger')('distributor');


exports.init = function(app, callback) {
	var distributor = new Distributor({
		nodes: app.config.nodes,
		projects: app.projects,
		saveBuild: function(build, callback) {
			Steppy(
				function() {
					if (!_(build.project).has('avgBuildDuration')) {
						getAvgProjectBuildDuration(build.project.name, this.slot());
					} else {
						this.pass(build.project.avgBuildDuration);
					}
				},
				function(err, avgBuildDuration) {
					build.project.avgBuildDuration = avgBuildDuration;

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

	// create resource for build data
	var createBuildDataResource = function(buildId) {
		if (buildId in buildDataResourcesHash) {
			return;
		}
		var buildDataResource = app.dataio.resource('build' + buildId);
		buildDataResource.on('connection', function(client) {
			var callback = this.async(),
				buildLogPath = getBuildLogPath(buildId);

			var stream = fs.createReadStream(buildLogPath, {
				encoding: 'utf8'
			});

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
					logger.error(
						'Error during read "' + buildLogPath + '":',
						err.stack || err
					);
				});
		});
		buildDataResourcesHash[buildId] = buildDataResource;
	};

	exports.createBuildDataResource = createBuildDataResource;

	var buildDataResourcesHash = {};

	distributor.on('buildUpdate', function(build, changes) {
		var buildsResource = app.dataio.resource('builds');

		if (build.status === 'queued') {
			// remove prev log if it exists - for development
			fs.unlink(getBuildLogPath(build.id));
			createBuildDataResource(build.id);
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

		var filePath = getBuildLogPath(build.id);

		if (!writeStreamsHash[filePath]) {
			writeStreamsHash[filePath] = fs.createWriteStream(
				getBuildLogPath(build.id), {encoding: 'utf8'}
			);
			writeStreamsHash[filePath].on('error', function(err) {
				logger.error(
					'Error during write "' + filePath + '":',
					err.stack || err
				);
			});
		}
		// TODO: close ended files
		writeStreamsHash[filePath].write(data);

		app.dataio.resource('build' + build.id).clientEmitSync(
			'data', data
		);
	});

	callback(null, distributor);
};
