'use strict';

var _ = require('underscore'),
	expect = require('expect.js'),
	sinon = require('sinon'),
	proxyquire = require('proxyquire').noCallThru();

describe('Projcts collection `create` method', function() {

	var getMocks = function(params) {
		return {
			projects: {
				_projectPathExists: sinon.stub().callsArgWithAsync(
					1, null, params.projectPathExists
				),
				_getProjectPath: sinon.stub().returns(
					params.projectPath
				),
				setConfig: sinon.stub().callsArgWithAsync(
					1, params.setConfigError, null
				)
			},
			fs: {
				mkdir: sinon.stub().callsArgWithAsync(
					1, null
				),
				rmdir: sinon.stub().callsArgWithAsync(
					1, null
				)
			}
		};
	};

	var getProjectsCollection = function(mocks) {
		var ProjectsCollection = proxyquire(
			'../../../lib/project', _(mocks).pick('fs')
		).ProjectsCollection;

		projects = new ProjectsCollection({});

		_(projects).extend(mocks.projects);

		return projects;
	};

	var projects, mocks;

	var checkProjectsPathExsitsCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it('should call `_projectPathExists` twice with project name', function() {
				expect(mocks.projects._projectPathExists.calledTwice).equal(true);
				var args = mocks.projects._projectPathExists.getCall(0).args;
				expect(args[0]).eql({name: expected.projectName});

				args = mocks.projects._projectPathExists.getCall(1).args;
				expect(args[0]).eql({name: expected.projectName, archived: true});
			});
		} else {
			it('should not call `_projectPathExists`', function() {
				expect(mocks.projects._projectPathExists.called).equal(false);
			});
		}
	};

	var checkProjectsGetPathCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it('should call `_getProjectPath` with project name', function() {
				expect(mocks.projects._getProjectPath.calledOnce).equal(true);
				var args = mocks.projects._getProjectPath.getCall(0).args;
				expect(args[0]).eql({name: expected.projectName});
			});
		} else {
			it('should not call `_getProjectPath`', function() {
				expect(mocks.projects._getProjectPath.called).equal(false);
			});
		}
	};

	var checkFsMkDirCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it('should call `fs.mkdir` for project path', function() {
				expect(mocks.fs.mkdir.calledOnce).equal(true);
				var args = mocks.fs.mkdir.getCall(0).args;
				expect(args[0]).eql(expected.projectPath);
			});
		} else {
			it('should not call `fs.mkdir`', function() {
				expect(mocks.fs.mkdir.called).equal(false);
			});
		}
	};

	var checkProjectsSetConfigCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it('should call `setConfig` with certain params', function() {
				expect(mocks.projects.setConfig.calledOnce).equal(true);
				var args = mocks.projects.setConfig.getCall(0).args;
				expect(args[0]).eql(expected.callParams);
			});
		} else {
			it('should not call `setConfig`', function() {
				expect(mocks.projects.setConfig.called).equal(false);
			});
		}
	};

	var checkFsRmDirCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it('should call `fs.rmdir` for project path', function() {
				expect(mocks.fs.rmdir.calledOnce).equal(true);
				var args = mocks.fs.rmdir.getCall(0).args;
				expect(args[0]).eql(expected.projectPath);
			});
		} else {
			it('should not call `fs.rmdir`', function() {
				expect(mocks.fs.rmdir.called).equal(false);
			});
		}
	};

	describe('with suitable params', function() {
		var projectName = 'test_project',
			projectPath = '/some/path',
			projectConfig = {someOption: 'someValue'};

		before(function() {
			mocks = getMocks({
				projectPathExists: false,
				projectPath: projectPath
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called without errors', function(done) {
			projects.create({
				name: projectName,
				config: projectConfig
			}, done);
		});

		checkProjectsPathExsitsCall({projectName: projectName});

		checkProjectsGetPathCall({projectName: projectName});

		checkFsMkDirCall({projectPath: projectPath});

		checkProjectsSetConfigCall({
			callParams: {
				projectDir: projectPath,
				config: projectConfig
			}
		});

		checkFsRmDirCall({called: false});
	});

	describe('when project name is not set', function() {
		var projectName = null,
			projectPath = '/some/path',
			projectConfig = {someOption: 'someValue'};

		before(function() {
			mocks = getMocks({
				projectPathExists: false,
				projectPath: projectPath
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called with error', function(done) {
			projects.create({
				name: projectName,
				config: projectConfig
			}, function(err) {
				expect(err).an(Error);
				expect(err.message).eql('Project name is required');
				done();
			});
		});

		checkProjectsPathExsitsCall({called: false});

		checkProjectsGetPathCall({called: false});

		checkFsMkDirCall({called: false});

		checkProjectsSetConfigCall({called: false});

		checkFsRmDirCall({called: false});
	});

	describe('when project path already exists', function() {
		var projectName = 'test_project',
			projectPath = '/some/path',
			projectConfig = {someOption: 'someValue'};

		before(function() {
			mocks = getMocks({
				projectPathExists: true,
				projectPath: projectPath
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called with error', function(done) {
			projects.create({
				name: projectName,
				config: projectConfig
			}, function(err) {
				expect(err).an(Error);
				expect(err.message).eql(
					'Project "' + projectName + '" already exists'
				);
				done();
			});
		});

		checkProjectsPathExsitsCall({projectName: projectName});

		checkProjectsGetPathCall({called: false});

		checkFsMkDirCall({called: false});

		checkProjectsSetConfigCall({called: false});

		checkFsRmDirCall({called: false});
	});

	describe('when setConfig throws error', function() {
		var projectName = 'test_project',
			projectPath = '/some/path',
			projectConfig = {someOption: 'someValue'},
			setConfigError = new Error('some error');

		before(function() {
			mocks = getMocks({
				projectPathExists: false,
				projectPath: projectPath,
				setConfigError: setConfigError
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called with error', function(done) {
			projects.create({
				name: projectName,
				config: projectConfig
			}, function(err) {
				expect(err).an(Error);
				expect(err).equal(setConfigError);
				done();
			});
		});

		checkProjectsPathExsitsCall({projectName: projectName});

		checkProjectsGetPathCall({projectName: projectName});

		checkFsMkDirCall({projectPath: projectPath});

		checkProjectsSetConfigCall({
			callParams: {
				projectDir: projectPath,
				config: projectConfig
			}
		});

		checkFsRmDirCall({projectPath: projectPath});
	});

});
