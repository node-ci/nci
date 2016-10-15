'use strict';

var libHttpServer = require('../lib/httpServer'),
	logger = require('../lib/logger')('http server');

module.exports = function(app, callback) {
	var httpServer = libHttpServer.create();

	httpServer.on('error', function(err, req, res) {
		if (req) {
			logger.error(
				'Error processing request ' + req.method + ' ' + req.url + ':',
				err.stack || err
			);
		} else {
			logger.error(err.stack || err);
		}

		if (res && !res.headersSent) {
			res.statusCode = 500;
			res.end();
		}
	});

	httpServer.addRequestListener(function(req, res, next) {
		var start = Date.now();

		res.on('finish', function() {
			var end = Date.now();

			logger.log(
				'[%s] %s %s %s - %s ms',
				new Date(end).toUTCString(),
				req.method,
				req.url,
				res.statusCode,
				end - start
			);
		});

		next();
	});

	callback(null, httpServer);
};
