'use strict';

var http = require('http'),
	nodeStatic = require('node-static'),
	jade = require('jade'),
	path = require('path'),
	fs = require('fs');

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

app.config = {};
app.config.paths = {};

// path to root dir (with projects, builds etc)
app.config.paths.data = path.join(process.cwd(), 'data');
app.config.paths.projects = path.join(app.config.paths.data, 'projects');
app.config.paths.builds = path.join(app.config.paths.data, 'builds');
fs.exists(app.config.paths.builds, function(exists) {
	if (!exists) fs.mkdir(app.config.paths.builds);
});

require('./resources')(app);

app.server.listen(3000);
