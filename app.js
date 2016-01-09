'use strict';

var env = process.env.NODE_ENV || 'development',
	db = require('./db'),
	httpServer = require('./lib/httpServer'),
	path = require('path'),
	fs = require('fs'),
	Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	reader = require('./lib/reader'),
	notifier = require('./lib/notifier'),
	ProjectsCollection = require('./lib/project').ProjectsCollection,
	BuildsCollection = require('./lib/build').BuildsCollection,
	libLogger = require('./lib/logger'),
	EventEmitter = require('events').EventEmitter,
	validateConfig = require('./lib/validateConfig'),
	utils = require('./lib/utils');

var app = new EventEmitter(),
	logger = libLogger('app'),
	httpApi;

var staticPath = path.join(__dirname, 'static');

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

app.httpServer.addRequestListener(function(req, res, next) {
	if (req.url.indexOf('/api/') === 0) {
		return httpApi(req, res, next);
	} else {
		next();
	}
});

var socketio = require('socket.io')(app.httpServer);
var dataio = require('./dataio')(socketio);

app.dataio = dataio;

app.lib = {};
app.lib.reader = reader;
app.lib.notifier = notifier;
app.lib.logger = libLogger;

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

		app.config.paths.projects = path.join(app.config.paths.data, 'projects');
		app.config.paths.db = path.join(app.config.paths.data, 'db');
		app.config.paths.preload = path.join(app.config.paths.data, 'preload.json');

		var dbDirExistsCallback = this.slot();
		fs.exists(app.config.paths.db, function(isExists) {
			dbDirExistsCallback(null, isExists);
		});

		var preloadExistsCallback = this.slot();
		fs.exists(app.config.paths.preload, function(isExists) {
			preloadExistsCallback(null, isExists);
		});
	},
	function(err, isDbDirExists, isPreloadExists) {
		if (isDbDirExists) {
			this.pass(null);
		} else {
			fs.mkdir(app.config.paths.db, this.slot());
		}

		if (isPreloadExists) {
			var preload = require(app.config.paths.preload);
			// register rc plugins
			_(preload.plugins).each(function(plugin) {
				logger.log('Preload plugin "%s"', plugin);
				require(plugin).register(app);
			});
		}

		reader.load(app.config.paths.data, 'config', this.slot());
	},
	function(err, mkdirResult, config) {
		this.pass(mkdirResult);

		validateConfig(config, this.slot());
	},
	function(err, mkdirResult, config) {
		_(app.config).defaults(config);
		_(app.config).defaults(configDefaults);

		logger.log('Server config:', utils.toPrettyJson(app.config));

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
			reader: reader,
			baseDir: app.config.paths.projects
		});

		completeUncompletedBuilds(this.slot());
	},
	function(err) {
		require('./distributor').init(app, this.slot());
	},
	function(err, distributor) {
		app.builds = new BuildsCollection({
			db: db,
			distributor: distributor
		});

		// register other plugins
		require('./lib/notifier/console').register(app);
		_(app.config.plugins).each(function(plugin) {
			logger.log('Load plugin "%s"', plugin);
			require(plugin).register(app);
		});

		httpApi = require('./httpApi')(app);

		notifier.init(app.config.notify, this.slot());

		// init resources
		require('./resources')(app);
	},
	function() {
		// load projects after all plugins to provide ability for plugins to
		// handle `projectLoaded` event
		app.projects.loadAll(this.slot());

		// serve index for all app pages, add this listener after all other
		// listeners
		app.httpServer.addRequestListener(function(req, res, next) {
			if (req.url.indexOf('/data.io.js') === -1) {
				if (env === 'development') {
					var jade = require('jade');
					// Compile a function
					var index = jade.compileFile(__dirname + '/views/index.jade');
					res.write(index({env: env}));
					res.end();
				} else {
					fs.createReadStream(path.join(staticPath, 'index.html'))
						.pipe(res);
				}
			} else {
				next();
			}
		});
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
