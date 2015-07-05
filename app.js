'use strict';

var db = require('./db'),
	http = require('http'),
	nodeStatic = require('node-static'),
	jade = require('jade'),
	path = require('path'),
	fs = require('fs'),
	Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	reader = require('./lib/reader'),
	notifier = require('./lib/notifier'),
	project = require('./lib/project'),
	libLogger = require('./lib/logger'),
	chokidar = require('chokidar');

var logger = libLogger('app');

var staticServer = new nodeStatic.Server('./static');
var server = http.createServer(function(req, res, next) {
	// serve index for all app pages
	if (req.url.indexOf('/data.io.js') === -1) {
		if (!req.url.match(/(js|css|fonts)/)) {
			// Compile a function
			var index = jade.compileFile(__dirname + '/views/index.jade');
			res.write(index());
			res.end();
		} else {
			staticServer.serve(req, res);
		}
	}
});

var socketio = require('socket.io')(server);
var dataio = require('./dataio')(socketio);

var app = {
	server: server,
	dataio: dataio
};

app.lib = {};
app.lib.reader = reader;
app.lib.notifier = notifier;
app.lib.logger = libLogger;

Steppy(
	function() {
		app.config = {};
		app.config.paths = {};

		// path to root dir (with projects, builds etc)
		app.config.paths.data = path.join(process.cwd(), 'data');
		app.config.paths.projects = path.join(app.config.paths.data, 'projects');
		app.config.paths.builds = path.join(app.config.paths.data, 'builds');
		app.config.paths.preload = path.join(app.config.paths.data, 'preload.json');

		var buildDirExistsCallback = this.slot();
		fs.exists(app.config.paths.builds, function(isExists) {
			buildDirExistsCallback(null, isExists);
		});

		var preloadExistsCallback = this.slot();
		fs.exists(app.config.paths.preload, function(isExists) {
			preloadExistsCallback(null, isExists);
		});
	},
	function(err, isBuildsDirExists, isPreloadExists) {
		if (!isBuildsDirExists) {
			fs.mkdir(app.config.paths.builds, this.slot());
		} else {
			this.pass(null);
		}

		if (isPreloadExists) {
			var preload = require(app.config.paths.preload);
			// register rc plugins
			_(preload.plugins).each(function(plugin) {
				require(plugin).register(app);
			});
		}

		reader.load(app.config.paths.data, 'config', this.slot());
	},
	function(err, mkdirResult, config) {
		_(app.config).defaults(config);

		logger.log('Server config:', JSON.stringify(app.config, null, 4));

		db.init('path/to/db/ignored/for/memdown', {
			db: require('memdown'),
			valueEncoding: 'json'
		}, this.slot());
	},
	function() {
		// load all projects for the first time
		project.loadAll(app.config.paths.projects, this.slot());
	},
	function(err, projects) {
		// note that `app.projects` is live variable
		app.projects = projects;
		logger.log('Loaded projects: ', _(app.projects).pluck('name'));

		require('./distributor').init(app, this.slot());
	},
	function(err, distributor) {
		app.distributor = distributor;

		// register other plugins
		require('./lib/notifier/console').register(app);
		require('./lib/notifier/mail').register(app);
		require('./httpApi').register(app);

		notifier.init(app.config.notify, this.slot());

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
				app.projects.splice(projectIndex, 1);
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

				});
			}
		};

		// NOTE: currently after add remove and then add same file events will
		// not be emitted
		var watcher = chokidar.watch(
			path.join(app.config.paths.projects, '*', 'config.*'),
			{ignoreInitial: true}
		);
		watcher.on('add', syncProject);
		watcher.on('change', syncProject);
		watcher.on('unlink', syncProject);

		watcher.on('error', function(err) {
			logger.error('File watcher error occurred: ', err.stack || err);
		});

		// init resources
		require('./resources')(app);
	},
	function(err) {
		if (err) throw err;
	}
);

app.server.listen(3000);
