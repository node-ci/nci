'use strict';

var _ = require('underscore'),
	expect = require('expect.js'),
	sinon = require('sinon'),
	proxyquire = require('proxyquire').noCallThru();

describe('Projcts collection `_projectPathExists` method', function() {

	var getMocks = function(params) {
		return {
			projects: {
				_getProjectPath: sinon.stub().returns(
					params.projectPath
				)
			},
			fs: {
				exists: sinon.stub().callsArgWithAsync(
					1, params.pathExists
				)
			}
		};
	};

	var projects, mocks;

	var checkProjectsGetPathCall = function(expected) {
		it('should call `_getProjectPath` with project name', function() {
			expect(mocks.projects._getProjectPath.calledOnce).equal(true);
			var args = mocks.projects._getProjectPath.getCall(0).args;
			expect(args[0]).eql(expected.projectName);
		});
	};

	var checkFsExistsCall = function(expected) {
		it('should call `fs.exists` with project path', function() {
			expect(mocks.fs.exists.calledOnce).equal(true);
			var args = mocks.fs.exists.getCall(0).args;
			expect(args[0]).eql(expected.projectPath);
		});
	};

	describe('when project path exists', function() {
		var projectName = 'test_project',
			projectPath = '/some/path';

		before(function() {
			mocks = getMocks({
				projectPath: projectPath,
				pathExists: true
			});

			var ProjectsCollection = proxyquire(
				'../../../lib/project', _(mocks).pick('fs')
			).ProjectsCollection;

			projects = new ProjectsCollection({});

			_(projects).extend(mocks.projects);
		});

		var pathExists;

		it('should be called witout errors', function(done) {
			projects._projectPathExists(projectName, function(err, result) {
				expect(err).not.ok();
				pathExists = result;
				done();
			});
		});

		checkProjectsGetPathCall({projectName: projectName});

		checkFsExistsCall({projectPath: projectPath});

		it('should return true', function() {
			expect(pathExists).equal(true);
		});
	});

	describe('when project path doesn`t exist', function() {
		var projectName = 'test_project',
			projectPath = '/some/path';

		before(function() {
			mocks = getMocks({
				projectPath: projectPath,
				pathExists: false
			});

			var ProjectsCollection = proxyquire(
				'../../../lib/project', mocks
			).ProjectsCollection;

			projects = new ProjectsCollection({});

			_(projects).extend(mocks.projects);
		});

		var pathExists;

		it('should be called witout errors', function(done) {
			projects._projectPathExists(projectName, function(err, result) {
				expect(err).not.ok();
				pathExists = result;
				done();
			});
		});

		checkProjectsGetPathCall({projectName: projectName});

		checkFsExistsCall({projectPath: projectPath});

		it('should return false', function() {
			expect(pathExists).equal(false);
		});
	});

});