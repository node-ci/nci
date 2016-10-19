'use strict';

var expect = require('expect.js'),
	proxyquire = require('proxyquire').noCallThru(),
	fs = require('fs'),
	_ = require('underscore');

// Mock all the things to provide app init

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


var App = proxyquire('../../app/index', {
	'./config': function(params, callback) {
		callback(null, config);
	},
	'../lib/project': {
		ProjectsCollection: ProjectsCollection
	},
	fs: {
		exists: function(path, callback) {
			if (path === config.paths.db) {
				callback(true);
			} else {
				fs.exists(path, callback);
			}
		}
	}
});

describe('App plugins api', function() {

	var app;

	before(function(done) {
		app = new App();

		app.init(done);
	});

	describe('lib', function() {
		it('should be presented in app', function() {
			expect(app).have.keys('lib');
		});

		it('should expose reader', function() {
			expect(app.lib.reader).an('object');
		});

		it('should expose reader register function', function() {
			expect(app.lib.reader.register).a('function');
		});

		it('should expose reader BaseReaderLoader', function() {
			expect(app.lib.reader.BaseReaderLoader).a('function');
		});

		it('should expose notifier', function() {
			expect(app.lib.notifier).an('object');
		});

		it('should expose notifier register function', function() {
			expect(app.lib.notifier.register).a('function');
		});

		it('should expose notifier BaseNotifierTransport', function() {
			expect(app.lib.notifier.BaseNotifierTransport).a('function');
		});

		it('should expose command', function() {
			expect(app.lib.command).an('object');
		});

		it('should expose command SpawnCommand', function() {
			expect(app.lib.command.SpawnCommand).a('function');
		});

		it('should expose executor', function() {
			expect(app.lib.executor).an('object');
		});

		it('should expose executor BaseExecutor', function() {
			expect(app.lib.executor.BaseExecutor).a('function');
		});

		it('should expose scm', function() {
			expect(app.lib.scm).an('object');
		});

		it('should expose scm register function', function() {
			expect(app.lib.scm.register).a('function');
		});

		it('should expose scm BaseScm', function() {
			expect(app.lib.scm.BaseScm).a('function');
		});

		it('should expose node', function() {
			expect(app.lib.node).an('object');
		});

		it('should expose node register function', function() {
			expect(app.lib.node.register).a('function');
		});

		it('should expose node BaseNode', function() {
			expect(app.lib.node.BaseNode).a('function');
		});
	});

});
