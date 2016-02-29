'use strict';

var env = process.env.NODE_ENV || 'development',
	db = require('./db'),
	httpServer = require('./lib/httpServer'),
	path = require('path'),
	fs = require('fs'),
	Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	Reader = require('./lib/reader').Reader,
	BaseReaderLoader = require('./lib/reader/loader/base').Loader,
	JsonReaderLoader = require('./lib/reader/loader/json').Loader,
	Notifier = require('./lib/notifier').Notifier,
	BaseNotifierTransport = require('./lib/notifier/transport/base').Transport,
	ConsoleNotifierTransport = require('./lib/notifier/transport/console').Transport,
	ProjectsCollection = require('./lib/project').ProjectsCollection,
	BuildsCollection = require('./lib/build').BuildsCollection,
	libLogger = require('./lib/logger'),
	libNode = require('./lib/node'),
	libCommand = require('./lib/command'),
	libExecutor = require('./lib/executor'),
	libScm = require('./lib/scm'),
	EventEmitter = require('events').EventEmitter,
	validateConfig = require('./lib/validateConfig'),
	utils = require('./lib/utils');

var app = new EventEmitter(),
	logger = libLogger('app');

app.reader = new Reader();
app.reader.register('json', JsonReaderLoader);

var httpServerLogger = libLogger('http server');

app.httpServer = httpServer.create();

app.httpServer.on('error', function(err, req, res) {
	httpServerLogger.error(
		'Error processing request ' + req.method + ' ' + req.url + ':',
		err.stack || err
	);
	if (!res.headersSent) {
		res.statusCode = 500;
		res.end();
	}
});

app.httpServer.addRequestListener(function(req, res, next) {
	var start = Date.now();

	res.on('finish', function() {
		var end = Date.now();

		httpServerLogger.log(
			'[%s] %s %s %s - %s ms',
			new Date(end).toUTCString(),
			req.method,
			req.url,
			res.statusCode,
			end - start
		);
	});

	next();
});

app.lib = {};
app.lib.BaseReaderLoader = BaseReaderLoader;
app.lib.BaseNotifierTransport = BaseNotifierTransport;
app.lib.logger = libLogger;
app.lib.command = libCommand;
app.lib.executor = libExecutor;
app.lib.scm = libScm;
app.lib.node = libNode;

var configDefaults = {
	notify: {},
	http: {host: '127.0.0.1', port: 3000, url: 'http://127.0.0.1:3000'}
};

var completeUncompletedBuilds = function(callback) {
	Steppy(
		function() {
			db.builds.find({
				start: {descCreateDate: ''},
				limit: 100
			}, this.slot());
		},
		function(err, lastBuilds) {
			var uncompletedBuilds = _(lastBuilds).filter(function(lastBuild) {
				return !lastBuild.completed;
			});

			var completeGroup = this.makeGroup();

			if (uncompletedBuilds.length) {
				var queuedAndOtherUncompletedBuilds = _(uncompletedBuilds).partition(
					function(uncompletedBuild) {
						return uncompletedBuild.status === 'queued';
					}
				);

				var queuedBuilds = queuedAndOtherUncompletedBuilds[0];
				uncompletedBuilds = queuedAndOtherUncompletedBuilds[1];

				if (queuedBuilds.length) {
					logger.log(
						'remove queued builds: %s',
						_(queuedBuilds).pluck('id').join(', ')
					);

					db.builds.del(queuedBuilds, completeGroup.slot());
				}

				if (uncompletedBuilds.length) {
					logger.log(
						'complete with interrupt error uncompleted builds: %s',
						_(uncompletedBuilds).pluck('id').join(', ')
					);

					_(uncompletedBuilds).each(function(uncompletedBuild) {
						var endDate = (
							uncompletedBuild.startDate ||
							uncompletedBuild.createDate
						);

						var sumDuration = _(uncompletedBuild.stepTimings).reduce(
							function(sum, timing) {
								return sum + timing.duration;
							},
							0
						) || 0;

						endDate += sumDuration;

						db.builds.update(
							{id: uncompletedBuild.id},
							{
								endDate: endDate,
								status: 'error',
								completed: true,
								error: {message: 'interrupted by server restart'}
							},
							completeGroup.slot()
						);
					});
				}
			}
		},
		callback
	);
};

Steppy(
	function() {
		app.config = {};
		app.config.paths = {};

		// path to root dir (with projects, builds etc)
		app.config.paths.data = path.join(process.cwd(), 'data');

		app.config.paths.preload = path.join(app.config.paths.data, 'preload.json');

		var preloadExistsCallback = this.slot();
		fs.exists(app.config.paths.preload, function(isExists) {
			preloadExistsCallback(null, isExists);
		});
	},
	function(err, isPreloadExists) {
		if (isPreloadExists) {
			var preload = require(app.config.paths.preload);
			// register rc plugins
			_(preload.plugins).each(function(plugin) {
				logger.log('Preload plugin "%s"', plugin);
				require(plugin).register(app);
			});
		}

		app.reader.load(app.config.paths.data, 'config', this.slot());
	},
	function(err, config) {
		validateConfig(config, this.slot());
	},
	function(err, config) {
		_(app.config).defaults(config);
		_(app.config).defaults(configDefaults);

		// try to read db and projects paths from config or set default values
		_(app.config.paths).defaults(config.paths, {
			db: path.join(app.config.paths.data, 'db'),
			projects: path.join(app.config.paths.data, 'projects')
		});

		logger.log('Server config:', utils.toPrettyJson(app.config));

		var dbDirExistsCallback = this.slot();
		fs.exists(app.config.paths.db, function(isExists) {
			dbDirExistsCallback(null, isExists);
		});
	},
	function(err, isDbDirExists) {
		if (isDbDirExists) {
			this.pass(null);
		} else {
			fs.mkdir(app.config.paths.db, this.slot());
		}
	},
	function() {
		var dbBackend = require(app.config.storage.backend);

		// monkey patch memdown to allow save empty strings which is correct
		// at general but occasionally not allowed at _checkKey
		// https://github.com/Level/abstract-leveldown/issues/74
		if (app.config.storage.backend === 'memdown') {
			dbBackend.prototype._checkKey = _.noop;
		}

		db.init(app.config.paths.db, {db: dbBackend}, this.slot());
	},
	function() {
		app.projects = new ProjectsCollection({
			db: db,
			reader: app.reader,
			baseDir: app.config.paths.projects
		});

		app.notifier = new Notifier({db: db});
		app.notifier.register('console', ConsoleNotifierTransport);

		completeUncompletedBuilds(this.slot());
	},
	function() {
		require('./distributor').init(app, this.slot());
	},
	function(err, distributor) {
		app.builds = new BuildsCollection({
			db: db,
			distributor: distributor
		});

		// register other plugins
		_(app.config.plugins).each(function(plugin) {
			logger.log('Load plugin "%s"', plugin);
			require(plugin).register(app);
		});

		app.notifier.init(app.config.notify, this.slot());
	},
	function() {
		// only at development and only when there is no other request listeners
		// (e.g. socketio) add not found route to the very end (after all
		// plugins register)
		if (
			env === 'development' &&
			app.httpServer._events &&
			_(app.httpServer._events.request).isFunction()
		) {
			app.httpServer.addRequestListener(function(req, res, next) {
				if (!res.headersSent) {
					res.statusCode = 404;
					res.end(req.method.toUpperCase() + ' ' + req.url + ' Not Found');
				}
			});
		}

		// load projects after all plugins to provide ability for plugins to
		// handle `projectLoaded` event
		app.projects.loadAll(this.slot());
	},
	function(err) {
		logger.log('Loaded projects: ', _(app.projects.getAll()).pluck('name'));

		var host = app.config.http.host,
			port = app.config.http.port;
		logger.log('Start http server on %s:%s', host, port);
		app.httpServer.listen(port, host);
	},
	function(err) {
		if (err) throw err;
	}
);
