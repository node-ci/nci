'use strict';

var expect = require('expect.js'),
	helpers = require('./helpers'),
	libReader = require('../../lib/reader'),
	libNotifier = require('../../lib/notifier'),
	libProject = require('../../lib/project'),
	libBuild = require('../../lib/build');

describe('App plugins api', function() {

	var app;

	before(function(done) {
		var App = helpers.requireApp();
		app = new App();

		app.init(done);
	});

	describe('lib', function() {
		it('should be presented in app', function() {
			expect(app).have.keys('lib');
		});

		it('should expose logger', function() {
			expect(app.lib.logger).a('function');
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

		it('should expose scm GitScm', function() {
			expect(app.lib.scm.GitScm).a('function');
		});

		it('should expose scm MercurialScm', function() {
			expect(app.lib.scm.MercurialScm).a('function');
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

	describe('instance', function() {
		it('reader should be presented in app', function() {
			expect(app).have.keys('reader');
		});

		it('reader should be instance of lib reader', function() {
			expect(app.reader).an('object');
			expect(app.reader).a(libReader.Reader);
		});

		it('notifier should be presented in app', function() {
			expect(app).have.keys('notifier');
		});

		it('notifier should be instance of notifier', function() {
			expect(app.notifier).an('object');
			expect(app.notifier).a(libNotifier.Notifier);
		});

		it('projects collection should be presented in app', function() {
			expect(app).have.keys('projects');
		});

		// coz mocked in helper
		it.skip('projects should be instance of projects collection', function() {
			expect(app.projects).an('object');
			expect(app.projects).a(libProject.ProjectsCollection);
		});

		it('builds collection should be presented in app', function() {
			expect(app).have.keys('builds');
		});

		it('builds should be instance of builds collection', function() {
			expect(app.builds).an('object');
			expect(app.builds).a(libBuild.BuildsCollection);
		});
	});
});
