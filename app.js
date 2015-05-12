'use strict';

var http = require('http');
var nodeStatic = require('node-static');
var jade = require('jade');
var path = require('path');

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
	// path to root dir (with projects, builds etc)
	dir: path.join(process.cwd(), 'data'),
	server: server,
	dataio: dataio
};

require('./resources')(app);

app.server.listen(3000);
