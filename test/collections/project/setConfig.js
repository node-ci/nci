'use strict';

var _ = require('underscore'),
	expect = require('expect.js'),
	sinon = require('sinon'),
	proxyquire = require('proxyquire').noCallThru(),
	path = require('path');

describe('Projcts collection `setConfig` method', function() {

	var getMocks = function(params) {
		return {
			projects: {
				_projectPathExists: sinon.stub().callsArgWithAsync(
					1, null, params.projectPathExists
				),
				_getProjectPath: sinon.stub().returns(
					params.projectPath
				),
				validateConfig: sinon.stub().callsArgWithAsync(
					1, params.validateConfigError, params.validateConfigResult
				),
				reload: sinon.stub().callsArgWithAsync(
					1, null
				)
			},
			fs: {
				writeFile: sinon.stub().callsArgWithAsync(
					3, null
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
			it('should call `_projectPathExists` with project name', function() {
				expect(mocks.projects._projectPathExists.calledOnce).equal(true);
				var args = mocks.projects._projectPathExists.getCall(0).args;
				expect(args[0]).eql(expected.projectName);
			});
		} else {
			it('should not call `_projectPathExists`', function() {
				expect(mocks.projects._projectPathExists.called).equal(false);
			});
		}
	};

	var checkProjectsValidateConfigCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it('should call `validateConfig` with config', function() {
				expect(mocks.projects.validateConfig.calledOnce).equal(true);
				var args = mocks.projects.validateConfig.getCall(0).args;
				expect(args[0]).eql(expected.config);
			});
		} else {
			it('should not call `validateConfig`', function() {
				expect(mocks.projects.validateConfig.called).equal(false);
			});
		}
	};

	var checkProjectsGetPathCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it('should call `_getProjectPath` with project name', function() {
				expect(mocks.projects._getProjectPath.calledOnce).equal(true);
				var args = mocks.projects._getProjectPath.getCall(0).args;
				expect(args[0]).eql(expected.projectName);
			});
		} else {
			it('should not call `_getProjectPath`', function() {
				expect(mocks.projects._getProjectPath.called).equal(false);
			});
		}
	};

	var checkFsWriteFileCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it('should call `fs.writeFile` for config', function() {
				expect(mocks.fs.writeFile.calledOnce).equal(true);
				var args = mocks.fs.writeFile.getCall(0).args;
				expect(args[0]).eql(expected.projectConfigFile.path);
				expect(args[1]).eql(expected.projectConfigFile.content);
				expect(args[2]).eql({encoding: 'utf-8'});
			});
		} else {
			it('should not call `fs.writeFile`', function() {
				expect(mocks.fs.writeFile.called).equal(false);
			});
		}
	};

	var checkProjectsReloadCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it('should call `reload` with project name', function() {
				expect(mocks.projects.reload.calledOnce).equal(true);
				var args = mocks.projects.reload.getCall(0).args;
				expect(args[0]).eql(expected.projectName);
			});
		} else {
			it('should not call `reload`', function() {
				expect(mocks.projects.reload.called).equal(false);
			});
		}
	};

	describe('with project config', function() {
		var projectName = 'test_project',
			projectPath = '/some/path',
			projectConfig = {someOption: 'someValue'};

		before(function() {
			mocks = getMocks({
				projectPathExists: true,
				projectPath: projectPath,
				validateConfigResult: projectConfig
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called witout errors', function(done) {
			projects.setConfig({
				projectName: projectName,
				config: projectConfig,
				load: true
			}, done);
		});

		checkProjectsPathExsitsCall({projectName: projectName});

		checkProjectsValidateConfigCall({config: projectConfig});

		checkProjectsGetPathCall({projectName: projectName});

		checkFsWriteFileCall({
			projectConfigFile: {
				path: path.join(projectPath, 'config.json'),
				content: JSON.stringify(projectConfig, null, 4)
			}
		});

		checkProjectsReloadCall({projectName: projectName});
	});

	describe('with project config file', function() {
		var projectName = 'test_project',
			projectPath = '/some/path',
			projectConfigFile = {name: 'config.yaml', content: 'yaml content'};

		before(function() {
			mocks = getMocks({
				projectPathExists: true,
				projectPath: projectPath
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called witout errors', function(done) {
			projects.setConfig({
				projectName: projectName,
				configFile: projectConfigFile
			}, done);
		});

		checkProjectsPathExsitsCall({projectName: projectName});

		checkProjectsValidateConfigCall({called: false});

		checkProjectsGetPathCall({projectName: projectName});

		checkFsWriteFileCall({
			projectConfigFile: {
				path: path.join(projectPath, projectConfigFile.name),
				content: projectConfigFile.content
			}
		});

		checkProjectsReloadCall({called: false});
	});

	describe('with project config, load true', function() {
		var projectName = 'test_project',
			projectPath = '/some/path',
			projectConfig = {someOption: 'someValue'};

		before(function() {
			mocks = getMocks({
				projectPathExists: true,
				projectPath: projectPath,
				validateConfigResult: projectConfig
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called witout errors', function(done) {
			projects.setConfig({
				projectName: projectName,
				config: projectConfig,
				load: true
			}, done);
		});

		checkProjectsPathExsitsCall({projectName: projectName});

		checkProjectsValidateConfigCall({config: projectConfig});

		checkProjectsGetPathCall({projectName: projectName});

		checkFsWriteFileCall({
			projectConfigFile: {
				path: path.join(projectPath, 'config.json'),
				content: JSON.stringify(projectConfig, null, 4)
			}
		});

		checkProjectsReloadCall({projectName: projectName});
	});

	describe('when project name is not set', function() {
		var projectName = null,
			projectPath = '/some/path',
			projectConfig = {someOption: 'someValue'};

		before(function() {
			mocks = getMocks({
				projectPathExists: true,
				projectPath: projectPath,
				validateConfigResult: projectConfig
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called with error', function(done) {
			projects.setConfig({
				projectName: projectName,
				config: projectConfig
			}, function(err) {
				expect(err).an(Error);
				expect(err.message).eql('Project name is required');

				done();
			});
		});

		checkProjectsPathExsitsCall({called: false});

		checkProjectsValidateConfigCall({called: false});

		checkProjectsGetPathCall({called: false});

		checkFsWriteFileCall({called: false});

		checkProjectsReloadCall({called: false});
	});

	describe('when project path doesn`t exist', function() {
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

		it('should be called with error', function(done) {
			projects.setConfig({
				projectName: projectName,
				config: projectConfig
			}, function(err) {
				expect(err).an(Error);
				expect(err.message).eql(
					'Project "' + projectName + '" doesn`t exist'
				);

				done();
			});
		});

		checkProjectsPathExsitsCall({projectName: projectName});

		checkProjectsValidateConfigCall({called: false});

		checkProjectsGetPathCall({called: false});

		checkFsWriteFileCall({called: false});

		checkProjectsReloadCall({called: false});
	});

	describe('when neither config or config file set', function() {
		var projectName = 'test_project',
			projectPath = '/some/path';

		before(function() {
			mocks = getMocks({
				projectPathExists: true,
				projectPath: projectPath
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called with error', function(done) {
			projects.setConfig({
				projectName: projectName
			}, function(err) {
				expect(err).an(Error);
				expect(err.message).eql(
					'`config` or `configFile` option is required'
				);

				done();
			});
		});

		checkProjectsPathExsitsCall({projectName: projectName});

		checkProjectsValidateConfigCall({called: false});

		checkProjectsGetPathCall({called: false});

		checkFsWriteFileCall({called: false});

		checkProjectsReloadCall({called: false});
	});

	describe('when config is not valid', function() {
		var projectName = 'test_project',
			projectPath = '/some/path',
			projectConfig = {someOption: 'someValue'},
			validateConfigError = new Error('mailformed config');

		before(function() {
			mocks = getMocks({
				projectPathExists: true,
				projectPath: projectPath,
				validateConfigError: validateConfigError
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called with error', function(done) {
			projects.setConfig({
				projectName: projectName,
				config: projectConfig
			}, function(err) {
				expect(err).an(Error);
				expect(err).equal(validateConfigError);

				done();
			});
		});

		checkProjectsPathExsitsCall({projectName: projectName});

		checkProjectsValidateConfigCall({config: projectConfig});

		checkProjectsGetPathCall({called: false});

		checkFsWriteFileCall({called: false});

		checkProjectsReloadCall({called: false});
	});

});