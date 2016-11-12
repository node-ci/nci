'use strict';

var App = require('./app/index'),
	logger = require('./lib/logger')('app'),
	app = new App({logger: logger});

app.init(function(err) {
	if (err) throw err;

	app.listen();
});
