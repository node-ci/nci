'use strict';

var env = process.env.NODE_ENV || 'development',
	db = require('./db'),
	path = require('path'),
	fs = require('fs'),
	Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	Reader = require('../lib/reader').Reader,
	Notifier = require('../lib/notifier').Notifier,
	ProjectsCollection = require('../lib/project').ProjectsCollection,
	BuildsCollection = require('../lib/build').BuildsCollection,
	logger = require('../lib/logger'),
	EventEmitter = require('events').EventEmitter,
	validateConfig = require('../lib/validateConfig'),
	utils = require('../lib/utils'),
	build = require('./build');

var app = new EventEmitter(),
	logger = logger('app');

app.reader = new Reader();

var configDefaults = {
	notify: {},
	http: {host: '127.0.0.1', port: 3000, url: 'http://127.0.0.1:3000'}
};


Steppy(
	function() {
		require('./lib')(app, this.slot());

		require('./httpServer')(app, this.slot());
	},
	function(err, lib, httpServer) {
		app.lib = lib;
		app.httpServer = httpServer;

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

		build.completeUncompleted({logger: logger}, this.slot());
	},
	function() {
		require('./distributor')(app, this.slot());
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

		distributor.init();

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
