'use strict';

var Steppy = require('twostep').Steppy,
	fs = require('fs'),
	path = require('path'),
	_ = require('underscore'),
	reader = require('./reader'),
	db = require('../db'),
	utils = require('./utils'),
	SpawnCommand = require('./command/spawn').Command,
	validateParams = require('./validateParams');


/**
 * Validates and returns given `config` to the `callback`(err, config)
 */
exports.validateConfig = function(config, callback) {
	Steppy(
		function() {
			validateParams(config, {
				type: 'object',
				properties: {
					scm: {
						type: 'object',
						required: true,
						properties: {
							type: {enum: ['git', 'mercurial'], required: true},
							repository: {type: 'string', required: true},
							rev: {type: 'string', required: true}
						}
					},
					steps: {
						type: 'array',
						required: true,
						items: {
							type: 'object',
							properties: {
								cmd: {type: 'string', required: true},
								shell: {type: 'string'}
							}
						}
					}
				},
				additionalProperties: true
			});

			this.pass(null);
		},
		function(err) {
			if (err) {
				err.message = (
					'Error during validation of project "' + config.name +
					'": ' + err.message
				);
			}
			callback(err, config);
		}
	);
};

/**
 * Loads and returns project
 */
exports.load = function(baseDir, name, callback) {
	var dir = path.join(baseDir, name);
	Steppy(
		function() {
			fs.readdir(dir, this.slot());
		},
		function(err, dirContent) {
			exports.loadConfig(dir, this.slot());
		},
		function(err, config) {
			config.name = name;
			config.dir = dir;

			exports.validateConfig(config, this.slot());
		},
		callback
	);
};

/**
 * Loads all projects from `baseDir` and returns array of projects
 */
exports.loadAll = function(baseDir, callback) {
	Steppy(
		function() {
			fs.readdir(baseDir, this.slot());
		},
		function(err, dirs) {
			var loadGroup = this.makeGroup();
			_(dirs).each(function(dir) {
				exports.load(baseDir, dir, loadGroup.slot());
			});
		},
		callback
	);
};

exports.loadConfig = function(dir, callback) {
	Steppy(
		function() {
			reader.load(dir, 'config', this.slot());
		},
		function(err, config) {
			// convert steps object to array
			if (!_(config.steps).isArray() && _(config.steps).isObject()) {
				config.steps = _(config.steps).map(function(val, name) {
					var step;
					if (_(val).isObject()) {
						step = val;
					} else {
						step = {cmd: val};
					}
					step.name = name;
					return step;
				});
			}

			// apply defaults to not yet validated config
			_(config.steps).each(function(step) {
				if (!step.type) step.type = 'shell';
				if (!step.name && step.cmd) step.name = utils.prune(step.cmd, 40);
			});

			this.pass(config);
		},
		callback
	);
};

exports.saveConfig = function(config, dir, callback) {
	fs.writeFile(
		path.join(dir, 'config.json'),
		JSON.stringify(config, null, 4),
		callback
	);
};

exports.create = function(baseDir, config, callback) {
	var dir;
	Steppy(
		function() {
			dir = path.join(baseDir, config.name);
			fs.mkdir(dir, this.slot());
		},
		function(err) {
			exports.saveConfig(config, baseDir, this.slot());
		},
		function(err) {
			exports.load(dir, this.slot());
		},
		callback
	);
};

exports.getAvgProjectBuildDuration = function(projectName, callback) {
	Steppy(
		function() {
			// get last done builds to calc avg build time
			db.builds.find({
				start: {
					projectName: projectName,
					status: 'done',
					descCreateDate: ''
				},
				limit: 10
			}, this.slot());
		},
		function(err, doneBuilds) {
			var durationsSum = _(doneBuilds).reduce(function(memo, build) {
				return memo + (build.endDate - build.startDate);
			}, 0);

			this.pass(Math.round(durationsSum / doneBuilds.length));
		},
		callback
	);
};

exports.remove = function(params, callback) {
	Steppy(
		function() {
			db.builds.find({
				start: {projectName: params.name, descCreateDate: ''}
			}, this.slot());

			new SpawnCommand().run({cmd: 'rm', args: [
				'-Rf', path.join(params.baseDir, params.name)
			]}, this.slot());
		},
		function(err, builds) {
			if (builds.length) {
				db.builds.del(builds, this.slot());

				var logLinesRemoveGroup = this.makeGroup();
				_(builds).each(function(build) {
					db.logLines.remove({
						start: {buildId: build.id}
					}, logLinesRemoveGroup.slot());
				});
			} else {
				this.pass(null, null);
			}
		},
		callback
	);
};

exports.rename = function(params, callback) {
	Steppy(
		function() {
			fs.rename(
				path.join(params.baseDir, params.name),
				path.join(params.baseDir, params.newName),
				this.slot()
			);

			db.builds.multiUpdate(
				{start: {projectName: params.name, descCreateDate: ''}},
				function(build) {
					build.project.name = params.newName;
					return build;
				},
				this.slot()
			);
		},
		callback
	);
};
