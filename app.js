'use strict';

var http = require('http');
var nodeStatic = require('node-static');

var staticServer = new nodeStatic.Server('./static');
var app = http.createServer(function(req, res, next) {
	// serve index for all app pages
	if (req.url.indexOf('/builds') === 0) {
		staticServer.serveFile('/index.html', 200, {}, req, res);
	} else {
		if (req.url.indexOf('/data.io.js') === -1) {
			staticServer.serve(req, res);
		}
	}
});

var io = require('socket.io')(app);
var data = require('data.io')(io);

require('./resources')(data);

app.listen(3000);
