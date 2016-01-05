'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	querystring = require('querystring');
/*
 * Pure rest api on pure nodejs follows below
 */

var router = {};
router.routes = {};

_(['get', 'post', 'patch', 'delete']).each(function(method) {
	router[method] = function(path, handler) {
		this.routes[method] = this.routes[method] || [];
		var keys = [],
			regExpStr = path.replace(/:(\w+)/g, function(match, name) {
				keys.push(name);
				return '(.+)';
			});

		this.routes[method].push({
			regExp: new RegExp('^' + regExpStr + '$'),
			handler: handler,
			keys: keys
		});
	};
});

router.del = router['delete'];

router.getRoute = function(req) {
	var parts,
		route = _(this.routes[req.method.toLowerCase()]).find(function(route) {
			parts = route.regExp.exec(req.path);
			return parts;
		});


	if (route && route.keys.length) {
		route.params = {};
		_(route.keys).each(function(key, index) {
			route.params[key] = parts[index + 1];
		});
	}

	return route;
};

module.exports = function(app) {
	var logger = app.lib.logger('http api'),
		accessToken = (Math.random() * Math.random()).toString(36).substring(2);

	logger.log('access token is: %s', accessToken);

	// run building of a project
	router.post('/api/0.1/builds', function(req, res, next) {
		Steppy(
			function() {
				var projectName = req.body.project,
					project = app.projects.get(projectName);

				if (project) {
					res.statusCode = 204;
					logger.log('Run project "%s"', projectName);
					app.distributor.run({
						projectName: projectName,
						withScmChangesOnly: req.body.withScmChangesOnly,
						queueQueued: req.body.queueQueued,
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

	router.del('/api/0.1/projects/:name', function(req, res, next) {
		var token = req.body.token,
			projectName = req.params.name;

		Steppy(
			function() {
				logger.log('Cleaning up project "%s"', projectName);

				if (token !== accessToken) {
					throw new Error('Access token doesn`t match');
				}

				app.projects.remove(projectName, this.slot());
			},
			function() {
				logger.log('Project "%s" cleaned up', projectName);
				res.statusCode = 204;
				res.end();
			},
			next
		);
	});

	router.patch('/api/0.1/projects/:name', function(req, res, next) {
		var token = req.body.token,
			projectName = req.params.name,
			newProjectName = req.body.name;

		Steppy(
			function() {
				logger.log(
					'Rename project "%s" to "%s"', projectName, newProjectName
				);

				if (token !== accessToken) {
					throw new Error('Access token doesn`t match');
				}

				if (!newProjectName) throw new Error('new project name is not set');

				var curProject = app.projects.get(projectName);
				if (!curProject) {
					throw new Error('Project "' + projectName + '" not found');
				}
				this.pass(curProject);

				var newProject = app.projects.get(newProjectName);
				if (newProject) {
					throw new Error(
						'Project name "' + newProjectName + '" already used'
					);
				}

				app.projects.rename(projectName, newProjectName, this.slot());
			},
			function(err) {
				res.statusCode = 204;
				res.end();
			},
			next
		);
	});

	return function(req, res) {

		Steppy(
			function() {
				var stepCallback = this.slot();

				var urlParts = req.url.split('?');
				req.path = urlParts[0];
				req.query = querystring.parse(urlParts[1]);

				req.setEncoding('utf-8');
				var bodyString = '';
				req.on('data', function(data) {
					bodyString += data;
				});
				req.on('end', function() {
					var body = bodyString ? JSON.parse(bodyString) : {};
					stepCallback(null, body);
				});
				req.on('error', stepCallback);
			},
			function(err, body) {
				req.body = body;

				var route = router.getRoute(req);
				if (route) {
					req.params = route.params;
					route.handler(req, res, this.slot());
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
