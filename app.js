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
	EventEmitter = require('events').EventEmitter;

var app = new EventEmitter(),
	logger = libLogger('app'),
	httpApi = require('./httpApi')(app);

var staticServer = new nodeStatic.Server('./static');
var server = http.createServer(function(req, res) {
	if (req.url.indexOf('/api/') === 0) {
		return httpApi(req, res);
	}

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

app.server = server;
app.dataio = dataio;

app.lib = {};
app.lib.reader = reader;
app.lib.notifier = notifier;
app.lib.logger = libLogger;

var configDefaults = {
	notify: {}
};

Steppy(
	function() {
		app.config = {};
		app.config.paths = {};

		// path to root dir (with projects, builds etc)
		app.config.paths.data = path.join(process.cwd(), 'data');
		app.config.paths.projects = path.join(app.config.paths.data, 'projects');
		app.config.paths.builds = path.join(app.config.paths.data, 'builds');
		app.config.paths.db = path.join(app.config.paths.data, 'db');
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
				logger.log('Preload plugin "%s"', plugin);
				require(plugin).register(app);
			});
		}

		reader.load(app.config.paths.data, 'config', this.slot());
	},
	function(err, mkdirResult, config) {
		_(app.config).defaults(config);
		_(app.config).defaults(configDefaults);

		logger.log('Server config:', JSON.stringify(app.config, null, 4));

		db.init(app.config.paths.db, {
			db: require(app.config.storage.backend),
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
		_(app.config.plugins).each(function(plugin) {
			logger.log('Load plugin "%s"', plugin);
			require(plugin).register(app);
		});

		notifier.init(app.config.notify, this.slot());

		require('./projectsWatcher').init(app, this.slot());

		require('./scheduler').init(app, this.slot());

		// notify about first project loading
		_(app.projects).each(function(project) {
			app.emit('projectLoaded', project);
		});

		// init resources
		require('./resources')(app);
	},
	function(err) {
		var httpConfig = _(app.config.http).defaults({
			host: '127.0.0.1', port: 3000
		});
		logger.log('Start http server on %s:%s', httpConfig.host, httpConfig.port);
		app.server.listen(httpConfig.port, httpConfig.host);
	},
	function(err) {
		if (err) throw err;
	}
);
