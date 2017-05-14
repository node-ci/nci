'use strict';

var _ = require('underscore'),
	expect = require('expect.js'),
	sinon = require('sinon'),
	proxyquire = require('proxyquire').noCallThru();

describe('Projcts collection `_getProjectPath` method', function() {

	var getMocks = function(params) {
		return {
			projects: {
				baseDir: params.baseDir,
				archiveDir: params.archiveDir
			},
			path: {
				join: sinon.stub().returns(params.joinedPath)
			}
		};
	};

	var getProjectsCollection = function(mocks) {
		var ProjectsCollection = proxyquire(
			'../../../lib/project', _(mocks).pick('path')
		).ProjectsCollection;

		projects = new ProjectsCollection({});

		_(projects).extend(mocks.projects);

		return projects;
	};

	var projects,
		mocks;

	var checkPathJoinCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it('should call `path.join` with certain params', function() {
				expect(mocks.path.join.calledOnce).equal(true);
				var args = mocks.path.join.getCall(0).args;
				expect(args[0]).eql(expected.dir);
				expect(args[1]).eql(expected.projectName);
			});
		} else {
			it('should not call `_getProjectPath`', function() {
				expect(mocks.path.join.called).equal(false);
			});
		}
	};

	describe('with project name', function() {
		var baseDir = '/tmp',
			projectName = 'test_project',
			expectedJoinedPath = '/tmp/123',
			joinedPath;

		before(function() {
			mocks = getMocks({
				baseDir: baseDir,
				joinedPath: expectedJoinedPath
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called without errors', function() {
			joinedPath = projects._getProjectPath({name: projectName});
		});

		checkPathJoinCall({dir: baseDir, projectName: projectName});

		it('should return joined path', function() {
			expect(joinedPath).equal(expectedJoinedPath);
		});
	});

	describe('with project name and archived: true', function() {
		var baseDir = '/tmp',
			archiveDir = '/var/tmp',
			projectName = 'test_project',
			expectedJoinedPath = '/tmp/123',
			joinedPath;

		before(function() {
			mocks = getMocks({
				baseDir: baseDir,
				archiveDir: archiveDir,
				joinedPath: expectedJoinedPath
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called without errors', function() {
			joinedPath = projects._getProjectPath({name: projectName, archived: true});
		});

		checkPathJoinCall({dir: archiveDir, projectName: projectName});

		it('should return joined path', function() {
			expect(joinedPath).equal(expectedJoinedPath);
		});
	});
});
