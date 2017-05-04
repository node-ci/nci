'use strict';

var _ = require('underscore'),
	expect = require('expect.js'),
	sinon = require('sinon'),
	proxyquire = require('proxyquire').noCallThru(),
	path = require('path');

describe('Projcts collection `loadAll` method', function() {

	var getMocks = function(params) {
		return {
			fs: {
				readdir: sinon.stub().callsArgWithAsync(
					1, params.readDirError, params.readDirResult
				)
			},
			junk: {
				not: sinon.spy(_.identity)
			},
			projects: {
				baseDir: params.projectsBaseDir,
				load: sinon.stub().callsArgWithAsync(
					1, params.loadError, null
				)
			}
		};
	};

	var getProjectsCollection = function(mocks) {
		var ProjectsCollection = proxyquire(
			'../../../lib/project', _(mocks).pick('fs', 'junk')
		).ProjectsCollection;

		projects = new ProjectsCollection({});

		_(projects).extend(mocks.projects);

		return projects;
	};

	var projects, mocks;

	var checkFsReadDirCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it('should call `fs.readdir` with projects base dir', function() {
				expect(mocks.fs.readdir.calledOnce).equal(true);
				var args = mocks.fs.readdir.getCall(0).args;
				expect(args[0]).eql(expected.projectsBaseDir);
			});
		} else {
			it('should not call `fs.readdir`', function() {
				expect(mocks.fs.readdir.called).equal(false);
			});
		}
	};

	var checkJunkNotCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it('should call `junk.not` for every project paths', function() {
				_(expected.projectNames).each(function(projectName, index) {
					var args = mocks.junk.not.getCall(index).args;
					expect(args[0]).eql(projectName);
				});
			});
		} else {
			it('should not call `junk.not`', function() {
				expect(mocks.junk.not.called).equal(false);
			});
		}
	};

	var checkProjectsLoadCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it('should call `load` for every project paths', function() {
				_(expected.projectNames).each(function(projectName, index) {
					var args = mocks.projects.load.getCall(index).args;
					expect(args[0]).eql(projectName);
				});
			});
		} else {
			it('should not call `load`', function() {
				expect(mocks.projects.load.called).equal(false);
			});
		}
	};

	describe('in general', function() {
		var projectsBaseDir = '/some/path',
			projectNames = ['test_project', 'another_project'];

		before(function() {
			mocks = getMocks({
				projectsBaseDir: projectsBaseDir,
				readDirResult: projectNames
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called witout errors', function(done) {
			projects.loadAll(done);
		});

		checkFsReadDirCall({projectsBaseDir: projectsBaseDir});

		checkJunkNotCall({projectNames: projectNames});

		checkProjectsLoadCall({projectNames: projectNames});
	});

	describe('when `fs.readdir` throws error', function() {
		var projectsBaseDir = '/some/path',
			projectNames = ['test_project', 'another_project'],
			readDirError = new Error('some error');

		before(function() {
			mocks = getMocks({
				projectsBaseDir: projectsBaseDir,
				readDirError: readDirError
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called with error', function(done) {
			projects.loadAll(function(err) {
				expect(err).equal(readDirError);
				done();
			});
		});

		checkFsReadDirCall({projectsBaseDir: projectsBaseDir});

		checkJunkNotCall({called: false});

		checkProjectsLoadCall({called: false});
	});

	describe('when `load` throws error', function() {
		var projectsBaseDir = '/some/path',
			projectNames = ['test_project', 'another_project'],
			loadError = new Error('some error');

		before(function() {
			mocks = getMocks({
				projectsBaseDir: projectsBaseDir,
				readDirResult: projectNames,
				loadError: loadError
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called with error', function(done) {
			projects.loadAll(function(err) {
				expect(err).equal(loadError);
				done();
			});
		});

		checkFsReadDirCall({projectsBaseDir: projectsBaseDir});

		checkJunkNotCall({projectNames: projectNames});

		checkProjectsLoadCall({projectNames: projectNames});
	});

});
