'use strict';

var _ = require('underscore'),
	path = require('path'),
	chokidar = require('chokidar'),
	project = require('./lib/project'),
	logger = require('./lib/logger')('projects watcher');

exports.init = function(app, callback) {
	// start file watcher for reloading projects on change
	var syncProject = function(filename, fileInfo) {
		var baseDir = app.config.paths.projects,
			projectName = path.relative(
				baseDir,
				path.dirname(filename)
			);

		var projectIndex = _(app.projects).findIndex(function(project) {
			return project.name === projectName;
		});

		if (projectIndex !== -1) {
			logger.log('Unload project: "' + projectName + '"');
			var unloadedProject = app.projects.splice(projectIndex, 1)[0];
			app.emit('projectUnloaded', unloadedProject);
		}

		// on add or change (info is falsy on unlink)
		if (fileInfo) {
			logger.log('Load project "' + projectName + '" on change');
			project.load(baseDir, projectName, function(err, project) {
				if (err) {
					return logger.error(
						'Error during load project "' + projectName + '": ',
						err.stack || err
					);
				}
				app.projects.push(project);
				logger.log(
					'Project "' + projectName + '" loaded:',
					JSON.stringify(project, null, 4)
				);
				app.emit('projectLoaded', project);
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
