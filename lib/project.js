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

/**
 * Projects collection contains all currently loaded projects and provides
 * operations for manipulating with them.
 * All projects stored on disk in `baseDir` and loaded to memory so
 * they can be received (by `get`, `getAll` and other methods) in a sync way.
 * Note that id for the particular project is a `name` of that project.
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
 * Validate and return given config.
 *
 * @param {Object} config
 * @param {Function} callback(err,config)
 */
ProjectsCollection.prototype.validateConfig = function(config, callback) {
	Steppy(
		function() {
			validateParams(config, {
				type: 'object',
				properties: {
					name: {
						type: 'string',
						pattern: /^(\w|-)+$/
					},
					scm: {
						type: 'object',
						required: true,
						properties: {
							type: {type: 'string', required: true},
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
								type: {'enum': ['shell']},
								shell: {type: 'string'},
								shellCmdArg: {type: 'string'}
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
};

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

			// apply defaults
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
 * Load project to collection.
 * `projectLoaded` event with loaded config as argument will be emitted after
 * load.
 *
 * @param {String} name
 * @param {Function} [callback(err)]
 */
ProjectsCollection.prototype.load = function(name, callback) {
	callback = callback || _.noop;
	var self = this,
		dir = self._getProjectPath(name);

	Steppy(
		function() {
			if (self.get(name)) {
				throw new Error(
					'Can`t load already loaded project "' + name + '"'
				);
			}

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

/**
 * Load all projects (from `this.baseDir`).
 * Calls `load` for every project in a base dir.
 *
 * @param {Function} [callback(err)]
 */
ProjectsCollection.prototype.loadAll = function(callback) {
	callback = callback || _.noop;
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

/**
 * Unload project from collection
 * `projectUnloaded` event with unloaded config as argument will be emitted
 * after unload.
 *
 * @param {String} name
 * @param {Function} [callback(err)]
 */
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

/**
 * Get project config by name.
 * Returns config object or undefined if project is not found.
 *
 * @param {String} name
 */
ProjectsCollection.prototype.get = function(name) {
	return _(this.configs).findWhere({name: name});
};

/**
 * Get configs for all currently loaded projects.
 * Returns array of config objects.
 */
ProjectsCollection.prototype.getAll = function() {
	return this.configs;
};

/**
 * Get project configs which match to predicate.
 * Returns array of config objects or empty array if there is no matched
 * project.
 *
 * @param {Function} predicate
 */
ProjectsCollection.prototype.filter = function(predicate) {
	return _(this.configs).filter(predicate);
};

/**
 * Remove project by name.
 * Calls `unload`, removes project from disk and db.
 *
 * @param {String} name
 * @param {Function} [callback(err)]
 */
ProjectsCollection.prototype.remove = function(name, callback) {
	callback = callback || _.noop;
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

/**
 * Rename project.
 * Renames project on disk and db, also changes name for loaded project.
 *
 * @param {String} name
 * @param {String} newName
 * @param {Function} [callback(err)]
 */
ProjectsCollection.prototype.rename = function(name, newName, callback) {
	callback = callback || _.noop;
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
