'use strict';

var App = require('./app/index'),
	app = new App();

app.init(function(err) {
	if (err) throw err;

	app.listen();
});
