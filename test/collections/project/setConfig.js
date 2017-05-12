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
				get: sinon.stub().returns(
					params.getResult
				),
				validateConfig: sinon.stub().callsArgWithAsync(
					1, params.validateConfigError, params.validateConfigResult
				),
				reload: sinon.stub().callsArgWithAsync(
					1, null
				)
			},
			fs: {
				exists: sinon.stub().callsArgWithAsync(
					1, params.projectPathExists
				),
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

	var checkProjectsGetCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it('should call `get` with config', function() {
				expect(mocks.projects.get.calledOnce).equal(true);
				var args = mocks.projects.get.getCall(0).args;
				expect(args[0]).eql(expected.projectName);
			});
		} else {
			it('should not call `get`', function() {
				expect(mocks.projects.get.called).equal(false);
			});
		}
	};

	var checkProjectsPathExsitsCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it('should call `_projectPathExists` with project name', function() {
				expect(mocks.projects._projectPathExists.calledOnce).equal(true);
				var args = mocks.projects._projectPathExists.getCall(0).args;
				expect(args[0]).eql({name: expected.projectName});
			});
		} else {
			it('should not call `_projectPathExists`', function() {
				expect(mocks.projects._projectPathExists.called).equal(false);
			});
		}
	};

	var checkFsExistsCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it('should call `fs.exists` with project name', function() {
				expect(mocks.fs.exists.calledOnce).equal(true);
				var args = mocks.fs.exists.getCall(0).args;
				expect(args[0]).eql(expected.projectPath);
			});
		} else {
			it('should not call `fs.exists`', function() {
				expect(mocks.fs.exists.called).equal(false);
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
				expect(args[0]).eql({name: expected.projectName});
			});
		} else {
			it('should not call `reload`', function() {
				expect(mocks.projects.reload.called).equal(false);
			});
		}
	};

	describe('with project name and config', function() {
		var projectName = 'test_project',
			projectPath = '/some/path',
			project = {name: projectName, dir: projectPath},
			projectConfig = {someOption: 'someValue'};

		before(function() {
			mocks = getMocks({
				getResult: project,
				validateConfigResult: projectConfig
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called witout errors', function(done) {
			projects.setConfig({
				projectName: projectName,
				config: projectConfig
			}, done);
		});

		checkProjectsGetCall({projectName: projectName});

		checkFsExistsCall({called: false});

		checkProjectsValidateConfigCall({config: projectConfig});

		checkFsWriteFileCall({
			projectConfigFile: {
				path: path.join(projectPath, 'config.json'),
				content: JSON.stringify(projectConfig, null, 4)
			}
		});

		checkProjectsReloadCall({called: false});
	});

	describe('with project name and config file', function() {
		var projectName = 'test_project',
			projectPath = '/some/path',
			project = {name: projectName, dir: projectPath},
			projectConfigFile = {name: 'config.yaml', content: 'yaml content'};

		before(function() {
			mocks = getMocks({
				getResult: project
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called witout errors', function(done) {
			projects.setConfig({
				projectName: projectName,
				configFile: projectConfigFile
			}, done);
		});

		checkProjectsGetCall({projectName: projectName});

		checkFsExistsCall({called: false});

		checkProjectsValidateConfigCall({called: false});

		checkFsWriteFileCall({
			projectConfigFile: {
				path: path.join(projectPath, projectConfigFile.name),
				content: projectConfigFile.content
			}
		});

		checkProjectsReloadCall({called: false});
	});

	describe('with project name, config, load true', function() {
		var projectName = 'test_project',
			projectPath = '/some/path',
			project = {name: projectName, dir: projectPath},
			projectConfig = {someOption: 'someValue'};

		before(function() {
			mocks = getMocks({
				getResult: project,
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

		checkProjectsGetCall({projectName: projectName});

		checkFsExistsCall({called: false});

		checkProjectsValidateConfigCall({config: projectConfig});

		checkFsWriteFileCall({
			projectConfigFile: {
				path: path.join(projectPath, 'config.json'),
				content: JSON.stringify(projectConfig, null, 4)
			}
		});

		checkProjectsReloadCall({projectName: projectName});
	});

	describe('with project name when project is not loaded', function() {
		var projectName = 'test_project',
			projectPath = '/some/path',
			project = null,
			projectConfig = {someOption: 'someValue'};

		before(function() {
			mocks = getMocks({
				getResult: project,
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
				expect(err.message).eql(
					'Project "' + projectName + '" doesn`t exist'
				);

				done();
			});
		});

		checkProjectsGetCall({projectName: projectName});

		checkFsExistsCall({called: false});

		checkProjectsValidateConfigCall({called: false});

		checkFsWriteFileCall({called: false});

		checkProjectsReloadCall({called: false});
	});

	describe('with project dir and config', function() {
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
				projectDir: projectPath,
				config: projectConfig
			}, done);
		});

		checkProjectsGetCall({called: false});

		checkFsExistsCall({projectPath: projectPath});

		checkProjectsValidateConfigCall({config: projectConfig});

		checkFsWriteFileCall({
			projectConfigFile: {
				path: path.join(projectPath, 'config.json'),
				content: JSON.stringify(projectConfig, null, 4)
			}
		});

		checkProjectsReloadCall({called: false});
	});

	describe('when project dir doesn`t exist', function() {
		var projectName = 'test_project',
			projectPath = '/some/path',
			projectConfig = {someOption: 'someValue'};

		before(function() {
			mocks = getMocks({
				projectPathExists: false,
				projectPath: projectPath,
				validateConfigResult: projectConfig
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called with error', function(done) {
			projects.setConfig({
				projectDir: projectPath,
				config: projectConfig
			}, function(err) {
				expect(err).an(Error);
				expect(err.message).eql(
					'Project dir "' + projectPath + '" doesn`t exist'
				);

				done();
			});
		});

		checkProjectsGetCall({called: false});

		checkFsExistsCall({projectPath: projectPath});

		checkProjectsValidateConfigCall({called: false});

		checkFsWriteFileCall({called: false});

		checkProjectsReloadCall({called: false});
	});

	describe('when project name and dir are not set', function() {
		var projectName = null,
			projectPath = '/some/path',
			projectConfig = {someOption: 'someValue'};

		before(function() {
			mocks = getMocks({
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
				expect(err.message).eql(
					'`projectName` or `projectDir` option is required'
				);

				done();
			});
		});

		checkProjectsGetCall({called: false});

		checkFsExistsCall({called: false});

		checkProjectsValidateConfigCall({called: false});

		checkFsWriteFileCall({called: false});

		checkProjectsReloadCall({called: false});
	});

	describe('when neither config or config file set', function() {
		var projectName = 'test_project',
			projectPath = '/some/path',
			project = {name: projectName, dir: projectPath};

		before(function() {
			mocks = getMocks({
				getResult: project
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

		checkProjectsGetCall({projectName: projectName});

		checkFsExistsCall({called: false});

		checkProjectsValidateConfigCall({called: false});

		checkFsWriteFileCall({called: false});

		checkProjectsReloadCall({called: false});
	});

	describe('when config is not valid', function() {
		var projectName = 'test_project',
			projectPath = '/some/path',
			project = {name: projectName, dir: projectPath},
			projectConfig = {someOption: 'someValue'},
			validateConfigError = new Error('mailformed config');

		before(function() {
			mocks = getMocks({
				getResult: project,
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

		checkProjectsGetCall({projectName: projectName});

		checkFsExistsCall({called: false});

		checkProjectsValidateConfigCall({config: projectConfig});

		checkFsWriteFileCall({called: false});

		checkProjectsReloadCall({called: false});
	});

});