'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	logger = require('./lib/logger')('http api');

/*
 * Pure rest api on pure nodejs follows below
 */
module.exports = function(app) {
	return function(req, res) {

		var projects = app.projects,
			distributor = app.distributor;

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
				res.statusCode = 404;

				// run building of a project
				if (req.url === '/api/builds' && req.method === 'POST') {
					var projectName = body.project,
						project = _(projects).findWhere({name: projectName});

					if (project) {
						res.statusCode = 204;
						logger.log('Run project "%s"', projectName);
						distributor.run({
							projectName: projectName,
							withScmChangesOnly: body.withScmChangesOnly,
							initiator: {type: 'httpApi'}
						});
					}

				}
				res.end();
			},
			function(err) {
				logger.error('Error occurred during request: ', err.stack || err);
			}
		);
	};

};
