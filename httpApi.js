'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	http = require('http');

/*
 * Pure rest api on pure nodejs follows below
 */
exports.register = function(app) {
	var config = _(app.config.httpApi).defaults({host: '127.0.0.1', port: 3030}),
		projects = app.projects,
		distributor = app.distributor,
		logger = app.lib.logger('http api');

	var server = http.createServer(function(req, res) {
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
				if (req.url === '/builds' && req.method === 'POST') {
					var projectName = body.project,
						project = _(projects).findWhere({name: projectName});

					if (project) {
						res.statusCode = 204;
						logger.log('Run "' + projectName + '"');
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
	});

	logger.log('Start listenning on %s:%s', config.host, config.port);
	server.listen(config.port, config.host);
};
