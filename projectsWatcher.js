'use strict';

var _ = require('underscore'),
	path = require('path'),
	chokidar = require('chokidar');

exports.init = function(app, callback) {
	var logger = app.lib.logger('projects watcher');

	// start file watcher for reloading projects on change
	var syncProject = function(filename, fileInfo) {
		var projectName = path.relative(
			app.config.paths.projects,
			path.dirname(filename)
		);

		if (app.projects.get(projectName)) {
			logger.log('Unload project: "' + projectName + '"');
			app.projects.unload(projectName);
		}

		// on add or change (info is falsy on unlink)
		if (fileInfo) {
			logger.log('Load project "' + projectName + '" on change');
			app.projects.load(projectName, function(err) {
				if (err) {
					return logger.error(
						'Error during load project "' + projectName + '": ',
						err.stack || err
					);
				}
				logger.log(
					'Project "' + projectName + '" loaded:',
					JSON.stringify(app.projects.get(projectName), null, 4)
				);
			});
		}
	};

	// NOTE: currently after add remove and then add same file events will
	// not be emitted
	var watcher = chokidar.watch(
		path.join(app.config.paths.projects, '*', 'config.*'),
		{ignoreInitial: true, depth: 1}
	);
	watcher.on('add', syncProject);
	watcher.on('change', syncProject);
	watcher.on('unlink', syncProject);

	watcher.on('error', function(err) {
		logger.error('File watcher error occurred: ', err.stack || err);
	});

	callback();
};
