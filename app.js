'use strict';

var http = require('http');
var nodeStatic = require('node-static');
var jade = require('jade');

var staticServer = new nodeStatic.Server('./static');
var server = http.createServer(function(req, res, next) {
	// serve index for all app pages
	if (req.url.indexOf('/data.io.js') === -1) {
		if (req.url.indexOf('/js') === -1) {
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

require('./resources')(app);

app.server.listen(3000);
