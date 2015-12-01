'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	logger = require('./lib/logger')('http api');

/*
 * Pure rest api on pure nodejs follows below
 */

var router = {};
router.routes = {};

_(['get', 'post', 'patch', 'del']).each(function(method) {
	router[method] = function(url, handler) {
		router.routes[method + ' ' + url] = handler;
	};
});

module.exports = function(app) {

	// run building of a project
	router.post('/api/builds', function(req, res, next) {
		Steppy(
			function() {
				var projectName = req.body.project,
					project = _(app.projects).findWhere({name: projectName});

				if (project) {
					res.statusCode = 204;
					logger.log('Run project "%s"', projectName);
					app.distributor.run({
						projectName: projectName,
						withScmChangesOnly: req.body.withScmChangesOnly,
						initiator: {type: 'httpApi'}
					});
				} else {
					res.statusCode = 404;
				}

				res.end();
			},
			next
		);
	});

	return function(req, res) {

		Steppy(
			function() {
				var stepCallback = this.slot();

				req.setEncoding('utf-8');
				var bodyString = '';
				req.on('data', function(data) {
					bodyString += data;
				});
				req.on('end', function() {
					var body = JSON.parse(bodyString);
					stepCallback(null, body);
				});
				req.on('error', stepCallback);
			},
			function(err, body) {
				req.body = body;

				var key = req.method.toLowerCase() + ' ' + req.url,
					handler = router.routes[key];

				if (handler) {
					handler(req, res, this.slot());
				} else {
					res.statusCode = 404;
					res.end();
				}
			},
			function(err) {
				logger.error('Error occurred during request: ', err.stack || err);
				res.statusCode = 500;
				res.end();
			}
		);
	};

};
