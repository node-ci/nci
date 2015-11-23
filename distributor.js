'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	Distributor = require('./lib/distributor').Distributor,
	getAvgProjectBuildDuration = (
		require('./lib/project').getAvgProjectBuildDuration
	),
	db = require('./db'),
	logger = require('./lib/logger')('distributor');


exports.init = function(app, callback) {
	var distributor = new Distributor({
		nodes: app.config.nodes,
		projects: app.projects,
		saveBuild: function(build, callback) {
			Steppy(
				function() {
					if (_(build.project).has('avgBuildDuration')) {
						this.pass(build.project.avgBuildDuration);
					} else {
						getAvgProjectBuildDuration(build.project.name, this.slot());
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
		},
		removeBuild: function(build, callback) {
			Steppy(
				function() {
					db.builds.del([build.id], this.slot());
				},
				callback
			);
		}
	});

	var buildDataResourcesHash = {};

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
						start: {buildId: buildId},
					}, this.slot());
				},
				function(err, lines) {
					var fullText = _(lines).reduce(function(memo, line) {
						return memo + line.text;
					}, '')

					client.emit('sync', 'data', {text: fullText});
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

	var buildsResource = app.dataio.resource('builds');

	distributor.on('buildUpdate', function(build, changes) {
		if (build.status === 'queued') {
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

	distributor.on('buildCancel', function(build) {
		buildsResource.clientEmitSync('cancel', {buildId: build.id});
	});

	var buildLogLineNumbersHash = {};

	distributor.on('buildData', function(build, data) {
		var logLineNumber = buildLogLineNumbersHash[build.id] || 0;

		buildLogLineNumbersHash[build.id] = ++logLineNumber
		app.dataio.resource('build' + build.id).clientEmitSync(
			'data',
			{text: data}
		);

		// write build logs to db
		db.logLines.put({
			text: data,
			number: logLineNumber,
			buildId: build.id
		}, function(err) {
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
