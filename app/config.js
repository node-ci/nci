'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	validateConfig = require('../lib/validateConfig'),
	path = require('path'),
	fs = require('fs');


module.exports = function(params, callback) {
	var config = {};
	var configDefaults = {
		notify: {},
		http: {host: '127.0.0.1', port: 3000, url: 'http://127.0.0.1:3000'}
	};

	Steppy(
		function() {
			config.paths = {};

			// path to root dir (with projects, builds etc)
			config.paths.data = path.join(process.cwd(), 'data');

			config.paths.preload = path.join(
				config.paths.data,
				'preload.json'
			);

			var preloadExistsCallback = this.slot();
			fs.exists(config.paths.preload, function(isExists) {
				preloadExistsCallback(null, isExists);
			});
		},
		function(err, isPreloadExists) {
			// preload plugins before read config file coz maybe reader
			// plugins will be loaded
			if (isPreloadExists) {
				var preload = require(config.paths.preload);
				// register preloaded plugins
				_(preload.plugins).each(function(plugin) {
					params.logger.log('Preload plugin "%s"', plugin);
					require(plugin).register(params.app);
				});
			}

			params.reader.load(config.paths.data, 'config', this.slot());
		},
		function(err, fileConfig) {
			validateConfig(fileConfig, this.slot());
		},
		function(err, fileConfig) {
			_(config).defaults(fileConfig);
			_(config).defaults(configDefaults);

			// try to read db and projects paths from config or set default values
			_(config.paths).defaults(fileConfig.paths, {
				db: path.join(config.paths.data, 'db'),
				projects: path.join(config.paths.data, 'projects'),
				archivedProjects: path.join(config.paths.data, 'archivedProjects')
			});

			this.pass(config);
		},
		callback
	);
};
