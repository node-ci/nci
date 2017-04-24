'use strict';

var _ = require('underscore'),
	expect = require('expect.js'),
	sinon = require('sinon'),
	proxyquire = require('proxyquire').noCallThru();

describe('Projcts collection `_getProjectPath` method', function() {

	var getMocks = function(params) {
		return {
			projects: {
				baseDir: params.baseDir
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
		mocks,
		joinedPath,
		baseDir = '/tmp',
		projectName = 'test_project',
		expectedJoinedPath = '/tmp/123';

	before(function() {
		mocks = getMocks({
			baseDir: baseDir,
			joinedPath: expectedJoinedPath
		});

		projects = getProjectsCollection(mocks);
	});

	it('should be called witout errors', function() {
		joinedPath = projects._getProjectPath(projectName);
	});

	it('should call `path.join` wtih base dir and project name', function() {
		expect(mocks.path.join.calledOnce).equal(true);
		var args = mocks.path.join.getCall(0).args;
		expect(args[0]).equal(baseDir);
		expect(args[1]).equal(projectName);
	});

	it('should return joined path', function() {
		expect(joinedPath).equal(expectedJoinedPath);
	});
});