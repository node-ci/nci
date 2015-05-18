'use strict';

var http = require('http'),
	nodeStatic = require('node-static'),
	jade = require('jade'),
	path = require('path'),
	fs = require('fs'),
	Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	reader = require('./lib/reader');

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

Steppy(
	function() {
		app.config = {};
		app.config.paths = {};

		// path to root dir (with projects, builds etc)
		app.config.paths.data = path.join(process.cwd(), 'data');
		app.config.paths.projects = path.join(app.config.paths.data, 'projects');
		app.config.paths.builds = path.join(app.config.paths.data, 'builds');
		var stepCallback = this.slot();
		fs.exists(app.config.paths.builds, function(isExists) {
			stepCallback(null, isExists);
		});
	},
	function(err, isBuildsDirExists) {
		if (!isBuildsDirExists) {
			fs.mkdir(app.config.paths.builds, this.slot());
		} else {
			this.pass(null);
		}

		// register plugins
		require('./lib/reader/yaml').register(app);

		reader.load(app.config.paths.data, 'config', this.slot());
	},
	function(err, mkdirResult, config) {
		_(app.config).defaults(config);

		console.log('Server config:', JSON.stringify(app.config, null, 4));

		// init resources
		require('./resources')(app);
	},
	function(err) {
		if (err) throw err;
	}
);

app.server.listen(3000);
