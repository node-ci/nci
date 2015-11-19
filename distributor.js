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
			var callback = this.async();
			Steppy(
				function() {
					db.logLines.find({
						start: {buildId: buildId, numberStr: ''},
					}, this.slot());
				},
				function(err, lines) {
					client.emit('sync', 'data', {lines: lines});
					this.pass(true);
				},
				function(err) {
					if (err) {
						logger.error(
							'error during read log for "' + buildId + '":',
							err.stack || err
						);
					}
					callback();
				}
			);
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

		// notify about build's project change, coz building affects project
		// related stat (last build date, avg build time, etc) 
		if (changes.completed) {
			var projectsResource = app.dataio.resource('projects');
			projectsResource.clientEmitSyncChange({name: build.project.name});
		}

		buildsResource.clientEmitSync('change', {
			buildId: build.id, changes: changes
		});
	});

	var writeStreamsHash = {};

	var buildLogLineNumbersHash = {};

	distributor.on('buildData', function(build, data) {
		var lines = data.trim().split('\n'),
			logLineNumber = buildLogLineNumbersHash[build.id] || 0;

		lines = _(lines).map(function(line, index) {
			return {
				number: logLineNumber + index,
				text: line
			};
		});
		buildLogLineNumbersHash[build.id] = logLineNumber + lines.length;

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
			'data',
			{lines: lines}
		);

		_(lines).each(function(line) {
			line.buildId = build.id;
		});
		// write build logs to db
		db.logLines.put(lines, function(err) {
			if (err) {
				logger.error(
					'Error during write log line "' + logLineNumber +
					'" for build "' + build.id + '":',
					err.stack || err
				);
			}
		});
	});

	callback(null, distributor);
};
