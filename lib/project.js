'use strict';

var Steppy = require('twostep').Steppy,
	fs = require('fs'),
	path = require('path'),
	_ = require('underscore');

function Project(config) {
	this.config = config;
}

/**
 * Validates and returns given `config` to the `callback`(err, config)
 */
exports.validateConfig = function(config, callback) {
	callback(null, config);
};

/**
 * Loads and returns project instance
 */
exports.load = function(baseDir, name, callback) {
	var dir = path.join(baseDir, name);
	Steppy(
		function() {
			fs.readdir(dir, this.slot());
		},
		function(err, dirContent) {
			if (dirContent.indexOf('config.json') === -1) throw new Error(
				'config.json is not found at project dir ' + dir
			);
			exports.loadConfig(dir, this.slot());
		},
		function(err, config) {
			exports.validateConfig(config, this.slot());
		},
		function(err, config) {
			config.dir = dir;
			this.pass(new Project(config));
		},
		callback
	);
};

/**
 * Loads all projects from `baseDir` and returns array of project instances
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
	var configPath = path.join(dir, 'config.json');
	Steppy(
		function() {
			fs.readFile(configPath, 'utf8', this.slot());
		},
		function(err, configText) {
			try {
				this.pass(JSON.parse(configText));
			} catch(error) {
				error.message = (
					'Error while parsing json from config ' +
					configPath + ': ' + error.message
				);
				throw error;
			}
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
