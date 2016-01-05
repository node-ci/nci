'use strict';

var Steppy = require('twostep').Steppy,
	fs = require('fs'),
	path = require('path'),
	_ = require('underscore'),
	utils = require('./utils'),
	SpawnCommand = require('./command/spawn').Command,
	validateParams = require('./validateParams'),
	EventEmitter = require('events').EventEmitter,
	inherits = require('util').inherits;

/*
 * Projects collection it's something similar to backbone collection.
 * But contrasting to backbone there is no model of a single project, when you
 * receive project from collection you just get a json.
 * General id for the particular project is a `name` of that project.
 */
function ProjectsCollection(params) {
	this.db = params.db;
	this.reader = params.reader;
	this.baseDir = params.baseDir;
	this.configs = [];
}

exports.ProjectsCollection = ProjectsCollection;

inherits(ProjectsCollection, EventEmitter);

/**
 * Validates and returns given `config` to the `callback`(err, config)
 */
ProjectsCollection.prototype.validateConfig = function(config, callback) {
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
								name: {type: 'string'},
								type: {enum: ['shell']},
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

ProjectsCollection.prototype._getProjectPath = function(name) {
	return path.join(this.baseDir, name);
}

ProjectsCollection.prototype._loadConfig = function(dir, callback) {
	var self = this;

	Steppy(
		function() {
			self.reader.load(dir, 'config', this.slot());
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

/**
 * Loads project to collection
 */
ProjectsCollection.prototype.load = function(name, callback) {
	var self = this,
		dir = self._getProjectPath(name);

	Steppy(
		function() {
			self._loadConfig(dir, this.slot());
		},
		function(err, config) {
			config.name = name;
			config.dir = dir;

			self.validateConfig(config, this.slot());
		},
		function(err, config) {
			self.configs.push(config);
			self.emit('projectLoaded', config);
			this.pass(null);
		},
		callback
	);
};

ProjectsCollection.prototype.unload = function(name, callback) {
	callback = callback || _.noop;
	var self = this;

	Steppy(
		function() {
			var index = _(self.configs).findIndex(function(config) {
				return config.name === name;
			});

			if (index === -1) {
				throw new Error('Can`t unload not loaded project: "' + name + '"');
			}

			var unloadedConfig = self.configs.splice(index, 1)[0];
			self.emit('projectUnloaded', unloadedConfig);

			this.pass(null);
		},
		callback
	);
};

ProjectsCollection.prototype.get = function(name) {
	return _(this.configs).findWhere({name: name});
};

ProjectsCollection.prototype.getAll = function(name) {
	return this.configs;
};

ProjectsCollection.prototype.findWhere = function(params) {
	return _(this.configs).findWhere(params);
};

ProjectsCollection.prototype.where = function(params) {
	return _(this.configs).where(params);
};

ProjectsCollection.prototype.filter = function(iterator) {
	return _(this.configs).filter(iterator);
};

ProjectsCollection.prototype.pluck = function(attribute) {
	return _(this.configs).pluck(attribute);
};

/**
 * Loads all projects (from `this.baseDir`)
 */
ProjectsCollection.prototype.loadAll = function(callback) {
	var self = this;

	Steppy(
		function() {
			fs.readdir(self.baseDir, this.slot());
		},
		function(err, dirs) {
			var loadGroup = this.makeGroup();
			_(dirs).each(function(dir) {
				self.load(dir, loadGroup.slot());
			});
		},
		callback
	);
};

/*
 * Calculates average build duration for the given project
 */
ProjectsCollection.prototype.getAvgBuildDuration = function(name, callback) {
	var self = this;

	Steppy(
		function() {
			// get last done builds to calc avg build time
			self.db.builds.find({
				start: {
					projectName: name,
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

ProjectsCollection.prototype.remove = function(name, callback) {
	var self = this;

	Steppy(
		function() {
			self.db.builds.find({
				start: {projectName: name, descCreateDate: ''}
			}, this.slot());

			new SpawnCommand().run({cmd: 'rm', args: [
				'-Rf', self._getProjectPath(name)
			]}, this.slot());

			self.unload(name, this.slot());
		},
		function(err, builds) {
			if (builds.length) {
				self.db.builds.del(builds, this.slot());

				var logLinesRemoveGroup = this.makeGroup();
				_(builds).each(function(build) {
					self.db.logLines.remove({
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

ProjectsCollection.prototype.rename = function(name, newName, callback) {
	var self = this;

	Steppy(
		function() {
			fs.rename(
				self._getProjectPath(name),
				self._getProjectPath(newName),
				this.slot()
			);

			self.db.builds.multiUpdate(
				{start: {projectName: name, descCreateDate: ''}},
				function(build) {
					build.project.name = newName;
					return build;
				},
				this.slot()
			);
		},
		function() {
			// just update currently loaded project name by link
			self.get(name).name = newName;

			this.pass(null);
		},
		callback
	);
};
