'use strict';

var Steppy = require('twostep').Steppy,
	fs = require('fs'),
	path = require('path'),
	_ = require('underscore'),
	reader = require('./reader'),
	db = require('../db'),
	utils = require('./utils');


/**
 * Validates and returns given `config` to the `callback`(err, config)
 */
exports.validateConfig = function(config, callback) {
	callback(null, config);
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
			exports.validateConfig(config, this.slot());
		},
		function(err, config) {
			config.name = name;
			config.dir = dir;
			this.pass(config);
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
			// apply defaults
			_(config.steps).each(function(step) {
				if (!step.type) step.type = 'shell';
				if (!step.name) step.name = utils.prune(step.cmd, 40);
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
