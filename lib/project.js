'use strict';

var Steppy = require('twostep').Steppy,
	fs = require('fs'),
	path = require('path'),
	_ = require('underscore'),
	utils = require('./utils'),
	SpawnCommand = require('./command/spawn').Command,
	validateParams = require('./validateParams'),
	EventEmitter = require('events').EventEmitter,
	inherits = require('util').inherits,
	junk = require('junk');

/**
 * Projects collection contains all currently loaded projects and provides
 * operations for manipulating with them.
 * All projects stored on disk in `baseDir` and `archiveDir` and loaded to
 * memory so they can be received (by `get`, `getAll` and other methods) in a
 * sync way.
 * Note that id for the particular project is a `name` of that project.
 */
function ProjectsCollection(params) {
	this.db = params.db;
	this.reader = params.reader;
	this.baseDir = params.baseDir;
	this.archiveDir = params.archiveDir;
	this.configs = [];
	this.loadingProjectsHash = {};
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
								shellCmdArg: {type: 'string'},
								shellExtraArgs: {
									type: 'array',
									items: {type: 'string'}
								}
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

ProjectsCollection.prototype._getProjectPath = function(params) {
	return path.join(
		params.archived ? this.archiveDir : this.baseDir,
		params.name
	);
};

ProjectsCollection.prototype._projectPathExists = function(params, callback) {
	var self = this;

	Steppy(
		function() {
			var stepCallback = this.slot();

			fs.exists(self._getProjectPath(params), function(exists) {
				stepCallback(null, exists);
			});
		},
		callback
	);
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
 * - `params.name` - name of the project to load
 * - `params.archived` - if true then try to load archived project
 *
 * @param {Object} params
 * @param {Function} [callback(err)]
 */
ProjectsCollection.prototype.load = function(params, callback) {
	// fallback for old signature when only name were passed
	if (!_(params).isObject()) {
		params = {name: params};
	}

	callback = callback || _.noop;
	var self = this,
		name = params.name,
		archived = Boolean(params.archived),
		dir;

	Steppy(
		function() {
			if (!name) {
				throw new Error('Project name is required');
			}

			dir = self._getProjectPath(params);

			// if project already loaded or loading just quit
			if (self.get(name) || self.loadingProjectsHash[name]) {
				return callback();
			}

			self.loadingProjectsHash[name] = 1;

			self._loadConfig(dir, this.slot());
		},
		function(err, config) {
			config.name = name;
			config.dir = dir;
			config.archived = archived;

			self.validateConfig(config, this.slot());
		},
		function(err, config) {
			self.configs.push(config);
			self.emit('projectLoaded', config);
			this.pass(null);
		},
		function(err) {
			delete self.loadingProjectsHash[name];

			callback(err);
		}
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

			fs.readdir(self.archiveDir, this.slot());
		},
		function(err, dirs, archivedDirs) {
			dirs = _(dirs).filter(junk.not);

			var loadGroup = this.makeGroup();
			_(dirs).each(function(dir) {
				self.load({name: dir}, loadGroup.slot());
			});

			archivedDirs = _(archivedDirs).filter(junk.not);

			var archiveLoadGroup = this.makeGroup();
			_(archivedDirs).each(function(dir) {
				self.load({name: dir, archived: true}, archiveLoadGroup.slot());
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

ProjectsCollection.prototype._archiveUnarchive = function(params, callback) {
	var self = this,
		name = params.name,
		action = params.action,
		project;

	Steppy(
		function() {
			if (!name) {
				throw new Error('Project name is required');
			}

			project = self.get(name);

			if (!project) {
				throw new Error('Can`t find project "' + name + '" for ' + action);
			}

			if (action === 'archive') {
				if (project.archived) {
					throw new Error('Project "' + name + '" already archived');
				}
			} else if (action === 'unarchive') {
				if (!project.archived) {
					throw new Error('Project "' + name + '" is not archived');
				}
			} else {
				throw new Error('Unknown action: ' + action);
			}

			self.unload(name, this.slot());
		},
		function() {
			var currrentPath, newPath;

			if (action === 'archive') {
				currrentPath = self._getProjectPath({name: name});
				newPath = self._getProjectPath({name: name, archived: true});
			} else if (action === 'unarchive') {
				currrentPath = self._getProjectPath({name: name, archived: true});
				newPath = self._getProjectPath({name: name});
			}

			fs.rename(currrentPath, newPath, this.slot());
		},
		function() {
			self.load(name, this.slot());
		},
		callback
	);
};

/**
 * Archive project.
 * - `params.name` - name of the project to archive
 *
 * @param {Object} params
 * @param {Function} [callback(err)]
 */
ProjectsCollection.prototype.archive = function(params, callback) {
	callback = callback || _.noop;
	var self = this,
		name = params.name;

	Steppy(
		function() {
			self._archiveUnarchive({
				name: name,
				action: 'archive'
			}, this.slot());
		},
		callback
	);
};

/**
 * Unarchive project.
 * - `params.name` - name of the project to unarchive
 *
 * @param {Object} params
 * @param {Function} [callback(err)]
 */
ProjectsCollection.prototype.unarchive = function(params, callback) {
	callback = callback || _.noop;
	var self = this,
		name = params.name;

	Steppy(
		function() {
			self._archiveUnarchive({
				name: name,
				action: 'unarchive'
			}, this.slot());
		},
		callback
	);
};

/**
 * Reload project.
 *
 * @param {String} name
 * @param {Function} [callback(err)]
 */
ProjectsCollection.prototype.reload = function(name, callback) {
	callback = callback || _.noop;
	var self = this;

	Steppy(
		function() {
			if (self.get(name)) {
				self.unload(name, this.slot());
			} else {
				this.pass(null);
			}
		},
		function(err) {
			self.load(name, this.slot());
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
			if (!name) {
				throw new Error('Project name is required');
			}

			var project = self.get(name);

			if (!project) {
				throw new Error('Can`t find project "' + name + '" for removing');
			}

			self.db.builds.find({
				start: {projectName: name, descCreateDate: ''}
			}, this.slot());

			new SpawnCommand().run({cmd: 'rm', args: [
				'-Rf', self._getProjectPath(_(project).pick('name', 'archived'))
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
			if (!name) {
				throw new Error('Project name is required');
			}

			if (!newName) {
				throw new Error('Project new name is required');
			}

			var project = self.get(name);

			if (!project) {
				throw new Error('Can`t find project "' + name + '" for rename');
			}

			fs.rename(
				self._getProjectPath({name: name, archived: project.archived}),
				self._getProjectPath({name: newName, archived: project.archived}),
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

/**
 * Create project.
 * - `params.name` - name of the project
 * - `params.config` - project configuratjion object
 * - `params.configFile` - project cconfig file object with `name` and
 * `content` fields (it's alternative for `config` option when need to set file
 * in specific format)
 * - `params.load` - if true then project will be loaded
 * @param {Object} params
 * @param {Function} [callback(err)]
 */
ProjectsCollection.prototype.create = function(params, callback) {
	callback = callback || _.noop;

	var self = this,
		name = params.name,
		dir;

	Steppy(
		function() {
			if (!name) {
				throw new Error('Project name is required');
			}

			self._projectPathExists({name: name}, this.slot());
			self._projectPathExists({name: name, archived: true}, this.slot());
		},
		function(err, projectPathExists, archivedProjectPathExists) {
			if (projectPathExists || archivedProjectPathExists) {
				throw new Error('Project "' + name + '" already exists');
			}

			dir = self._getProjectPath({name: name});

			fs.mkdir(dir, this.slot());
		},
		function(err, setConfigParams) {
			self.setConfig(
				_({projectName: name}).extend(
					_(params).pick('config', 'configFile', 'load')
				),
				this.slot()
			);
		},
		function(err) {
			if (err) {
				if (dir) {
					// try to remove project dir to prevent dir without config
					fs.rmdir(dir, function(err) {
						if (err) {
							console.error('Error while removing project dir: ' + dir);
						}
					});
				}
			}

			callback(err);
		}
	);
};

/**
 * Set config file for the project.
 * - `params.projectName` - name of the project
 * - `params.config` - project configuratjion object
 * - `params.configFile` - project cconfig file object with `name` and
 * `content` fields (it's alternative for `config` option when need to set file
 * in specific format)
 * - `params.load` - if true then project will be loaded
 * @param {Object} params
 * @param {Function} [callback(err)]
 */
ProjectsCollection.prototype.setConfig = function(params, callback) {
	callback = callback || _.noop;

	var self = this,
		projectName = params.projectName,
		config = params.config,
		load = params.load;

	Steppy(
		function() {
			if (!projectName) {
				throw new Error('Project name is required');
			}
			self._projectPathExists({name: projectName}, this.slot());
		},
		function(err, projectPathExists) {
			if (!projectPathExists) {
				throw new Error('Project "' + projectName + '" doesn`t exist');
			}

			if (config) {
				self.validateConfig(config, this.slot());
			} else {
				this.pass(null);
			}
		},
		function() {
			var configFile;

			if (config) {
				configFile = {
					name: 'config.json',
					content: JSON.stringify(config, null, 4)
				};
			} else if (params.configFile) {
				configFile = params.configFile;
			} else {
				throw new Error('`config` or `configFile` option is required');
			}

			// TODO: remove all configs from projects dir

			fs.writeFile(
				path.join(self._getProjectPath({name: projectName}), configFile.name),
				configFile.content,
				{encoding: 'utf-8'},
				this.slot()
			);
		},
		function(err) {
			if (load) {
				self.reload(projectName, this.slot());
			} else {
				this.pass(null);
			}
		},
		callback
	);
};