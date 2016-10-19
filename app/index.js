'use strict';

var env = process.env.NODE_ENV || 'development',
	db = require('./db'),
	fs = require('fs'),
	Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	Reader = require('../lib/reader').Reader,
	Notifier = require('../lib/notifier').Notifier,
	ProjectsCollection = require('../lib/project').ProjectsCollection,
	BuildsCollection = require('../lib/build').BuildsCollection,
	EventEmitter = require('events').EventEmitter,
	utils = require('../lib/utils'),
	inherits = require('util').inherits;

function App(params) {
	params = params || {};
	this.logger = params.logger || utils.noopLogger;
}

inherits(App, EventEmitter);

App.prototype.init = function(callback) {
	var self = this;

	Steppy(
		function() {
			require('./lib')({}, this.slot());

			require('./httpServer')({}, this.slot());
		},
		function(err, lib, httpServer) {
			self.lib = lib;
			self.httpServer = httpServer;
			self.reader = new Reader();

			require('./config')({
				app: self,
				reader: self.reader,
				logger: self.logger
			}, this.slot());
		},
		function(err, config) {
			self.config = config;

			self.logger.log('Server config:', utils.toPrettyJson(self.config));

			var dbDirExistsCallback = this.slot();
			fs.exists(self.config.paths.db, function(isExists) {
				dbDirExistsCallback(null, isExists);
			});
		},
		function(err, isDbDirExists) {
			if (isDbDirExists) {
				this.pass(null);
			} else {
				fs.mkdir(self.config.paths.db, this.slot());
			}
		},
		function() {
			var dbBackend = require(self.config.storage.backend);

			// monkey patch memdown to allow save empty strings which is correct
			// at general but occasionally not allowed at _checkKey
			// https://github.com/Level/abstract-leveldown/issues/74
			if (self.config.storage.backend === 'memdown') {
				dbBackend.prototype._checkKey = _.noop;
			}

			db.init(self.config.paths.db, {db: dbBackend}, this.slot());
		},
		function() {
			self.projects = new ProjectsCollection({
				db: db,
				reader: self.reader,
				baseDir: self.config.paths.projects
			});

			self.notifier = new Notifier({db: db});

			require('./distributor')(self, this.slot());
		},
		function(err, distributor) {
			self.builds = new BuildsCollection({
				db: db,
				distributor: distributor
			});

			self.builds.completeUncompleted({logger: self.logger}, this.slot());

			// register other plugins
			_(self.config.plugins).each(function(plugin) {
				self.logger.log('Load plugin "%s"', plugin);
				require(plugin).register(self);
			});

			distributor.init();

			self.notifier.init(self.config.notify, this.slot());
		},
		function() {
			// only at development and only when there is no other request listeners
			// (e.g. socketio) add not found route to the very end (after all
			// plugins register)
			if (
				env === 'development' &&
				self.httpServer._events &&
				_(self.httpServer._events.request).isFunction()
			) {
				self.httpServer.addRequestListener(function(req, res, next) {
					if (!res.headersSent) {
						res.statusCode = 404;
						res.end(req.method.toUpperCase() + ' ' + req.url + ' Not Found');
					}
				});
			}

			// load projects after all plugins to provide ability for plugins to
			// handle `projectLoaded` event
			self.projects.loadAll(this.slot());
		},
		function(err) {
			self.logger.log(
				'Loaded projects: ', _(self.projects.getAll()).pluck('name')
			);

			this.pass(null);
		},
		callback
	);

};

App.prototype.listen = function() {
	var host = this.config.http.host,
		port = this.config.http.port;

	this.logger.log('Start http server on %s:%s', host, port);
	this.httpServer.listen(port, host);
};

module.exports = App;
