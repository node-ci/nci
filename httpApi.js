'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	querystring = require('querystring'),
	logger = require('./lib/logger')('http api'),
	project = require('./lib/project');

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

	// TODO: restrict access with some sort of token
	router.del('/api/projects/:name', function(req, res, next) {
		var projectName = req.params.name;
		Steppy(
			function() {
				logger.log('Cleaning up project "%s"', projectName);
				project.remove({
					baseDir: app.config.paths.projects,
					name: projectName
				}, this.slot());
			},
			function() {
				logger.log('Project "%s" cleaned up', projectName);
				res.statusCode = 204;
				res.end();
			},
			next
		);
	});

	router.patch('/api/projects/:name', function(req, res, next) {
		var projectName = req.params.name,
			newProjectName = req.body.name;

		Steppy(
			function() {
				logger.log(
					'Rename project "%s" to "%s"', projectName, newProjectName
				);

				if (!newProjectName) throw new Error('new project name is not set');

				var curProject = _(app.projects).findWhere({name: projectName});
				if (!curProject) {
					throw new Error('Project "' + projectName + '" not found');
				}
				this.pass(curProject);

				var newProject = _(app.projects).findWhere({name: newProjectName});
				if (newProject) {
					throw new Error(
						'Project name "' + newProjectName + '" already used'
					);
				}

				project.rename({
					baseDir: app.config.paths.projects,
					name: projectName,
					newName: newProjectName
				}, this.slot());
			},
			function(err, curProject) {
				curProject.name = newProjectName;

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
