'use strict';

var fs = require('fs'),
	path = require('path'),
	_ = require('underscore'),
	Steppy = require('twostep').Steppy,
	validateConfig = require('../lib/validateConfig');

var preload = function(app, preloadPath) {
	var preloadConfig = null;

	try {
		preloadConfig = app.require(preloadPath);
	} catch(error) {
		if (error.code !== 'MODULE_NOT_FOUND') throw error;
	}

	// register preloadable plugins
	if (preloadConfig) {
		app.loadPlugins(preloadConfig.plugins);
	}
};

module.exports = function(params, callback) {
	var configDefaults = {
		notify: {},
		http: {
			host: '127.0.0.1',
			port: 3000,
			url: 'http://127.0.0.1:3000'
		}
	};

	var paths = {};

	Steppy(
		function() {
			// path to cwd
			paths.cwd = process.cwd();

			// path to data dir (with projects, builds etc)
			paths.data = path.join(paths.cwd, 'data');

			// path to preload.json file with preloadable plugins list
			paths.preload = path.join(paths.data, 'preload.json');

			// preload plugins first coz reader plugins could be loaded
			preload(params.app, paths.preload);

			// read config with reader help
			params.reader.load(paths.data, 'config', this.slot());
		},
		function(err, config) {
			validateConfig(config, this.slot());
		},
		function(err, config) {
			// try to read db and projects paths from config or set default values
			_(paths).defaults(config.paths, {
				db: path.join(paths.data, 'db'),
				projects: path.join(paths.data, 'projects'),
				archivedProjects: path.join(paths.data, 'archivedProjects')
			});

			// combine all parts together
			config = _({paths: paths}).defaults(config, configDefaults);

			this.pass(config);
		},
		callback
	);
};
