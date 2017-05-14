'use strict';

var _ = require('underscore'),
	proxyquire = require('proxyquire').noCallThru(),
	fs = require('fs');

var config = {
	paths: {db: 'some/path'},
	nodes: [{type: 'local', maxExecutorsCount: 1}],
	notify: {},
	storage: {backend: 'memdown'}
};

function ProjectsCollection() {
}

ProjectsCollection.prototype.loadAll = function(callback) {
	callback();
};

ProjectsCollection.prototype.getAll = _.noop;

exports.requireApp = function(params) {
	return proxyquire('../../app/index', {
		'./config': function(params, callback) {
			callback(null, config);
		},
		'../lib/project': {
			ProjectsCollection: ProjectsCollection
		},
		fs: {
			exists: function(path, callback) {
				var existingPaths = [
					config.paths.db,
					config.paths.archivedProjects
				];

				if (_(existingPaths).contains(path)) {
					callback(true);
				} else {
					fs.exists(path, callback);
				}
			}
		}
	});
};
