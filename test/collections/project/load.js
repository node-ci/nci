'use strict';

var _ = require('underscore'),
	expect = require('expect.js'),
	sinon = require('sinon');

describe('Projcts collection `load` method', function() {

	var getMocks = function(params) {
		return {
			projects: {
				_getProjectPath: sinon.stub().returns(
					params.projectPath
				),
				get: sinon.stub().returns(params.projectsGetResult),
				_loadConfig: sinon.stub().callsArgWithAsync(
					1, null, params.loadConfigResult
				),
				validateConfig: sinon.stub().callsArgWithAsync(
					1, null, params.validateConfigResult
				),
				configs: {
					push: sinon.stub()
				},
				emit: sinon.stub(),
				loadingProjectsHash: params.loadingProjectsHash || {}
			}
		};
	};

	var getProjectsCollection = function(mocks) {
		var ProjectsCollection = require(
			'../../../lib/project'
		).ProjectsCollection;

		projects = new ProjectsCollection({});

		_(projects).extend(mocks.projects);

		return projects;
	};

	var projects, mocks;

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

	var checkProjectsGetCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it('should call `get` with project name', function() {
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

	var checkProjectsLoadConfigCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it('should call `_loadConfig` with project path', function() {
				expect(mocks.projects._loadConfig.calledOnce).equal(true);
				var args = mocks.projects._loadConfig.getCall(0).args;
				expect(args[0]).eql(expected.projectPath);
			});
		} else {
			it('should not call `_loadConfig`', function() {
				expect(mocks.projects._loadConfig.called).equal(false);
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

	var checkProjectsConfigsPushCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it('should call `configs.push` with config', function() {
				expect(mocks.projects.configs.push.calledOnce).equal(true);
				var args = mocks.projects.configs.push.getCall(0).args;
				expect(args[0]).eql(expected.config);
			});
		} else {
			it('should not call `configs.push`', function() {
				expect(mocks.projects.configs.push.called).equal(false);
			});
		}
	};

	var checkProjectsEmitCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it('should call `emit` with event name and config', function() {
				expect(mocks.projects.emit.calledOnce).equal(true);
				var args = mocks.projects.emit.getCall(0).args;
				expect(args[0]).eql(expected.eventName);
				expect(args[1]).eql(expected.config);
			});
		} else {
			it('should not call `emit`', function() {
				expect(mocks.projects.emit.called).equal(false);
			});
		}
	};

	var checkProjectsLoadingHash = function(expected) {
		expected.contains = _(expected).has('contains') ? expected.contains : true;

		if (expected.contains) {
			it('should contain project name in loading hash', function() {
				expect(projects.loadingProjectsHash).have.keys([expected.projectName]);
			});
		} else {
			it('should not contain project name in loading hash', function() {
				expect(projects.loadingProjectsHash).not.have.keys([expected.projectName]);
			});
		}
	};

	describe('with suitable params', function() {
		var projectName = 'test_project',
			projectPath = '/some/path',
			projectConfig = {someOption: 'someValue'};

		var projectConfigExtended = _({
			name: projectName,
			dir: projectPath,
			archived: false
		}).extend(projectConfig);

		before(function() {
			mocks = getMocks({
				projectPath: projectPath,
				projectsGetResult: null,
				loadConfigResult: projectConfig,
				validateConfigResult: projectConfigExtended
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called witout errors', function(done) {
			projects.load(projectName, done);
		});

		checkProjectsGetPathCall({projectName: projectName});

		checkProjectsGetCall({projectName: projectName});

		checkProjectsLoadConfigCall({projectPath: projectPath});

		checkProjectsValidateConfigCall({config: projectConfigExtended});

		checkProjectsConfigsPushCall({config: projectConfigExtended});

		checkProjectsEmitCall({
			eventName: 'projectLoaded',
			config: projectConfigExtended
		});

		checkProjectsLoadingHash({contains: false, projectName: projectName});
	});

	describe('when project name is not set', function() {
		var projectName = null,
			projectPath = '/some/path',
			projectConfig = {someOption: 'someValue'};

		var projectConfigExtended = _({
			name: projectName,
			dir: projectPath
		}).extend(projectConfig);

		before(function() {
			mocks = getMocks({
				projectPath: projectPath,
				projectsGetResult: null,
				loadConfigResult: projectConfig,
				validateConfigResult: projectConfigExtended
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called with error', function(done) {
			projects.load(projectName, function(err) {
				expect(err).an(Error);
				expect(err.message).eql('Project name is required');

				done();
			});
		});

		checkProjectsGetPathCall({called: false});

		checkProjectsGetCall({called: false});

		checkProjectsLoadConfigCall({called: false});

		checkProjectsValidateConfigCall({called: false});

		checkProjectsConfigsPushCall({called: false});

		checkProjectsEmitCall({called: false});

		checkProjectsLoadingHash({contains: false, projectName: projectName});
	});

	describe('when project already loaded', function() {
		var projectName = 'test_project',
			projectPath = '/some/path',
			projectConfig = {someOption: 'someValue'};

		var projectConfigExtended = _({
			name: projectName,
			dir: projectPath
		}).extend(projectConfig);

		before(function() {
			mocks = getMocks({
				projectPath: projectPath,
				projectsGetResult: {name: projectName},
				loadConfigResult: projectConfig,
				validateConfigResult: projectConfigExtended
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called withot errors', function(done) {
			projects.load(projectName, done);
		});

		checkProjectsGetPathCall({projectName: projectName});

		checkProjectsGetCall({projectName: projectName});

		checkProjectsLoadConfigCall({called: false});

		checkProjectsValidateConfigCall({called: false});

		checkProjectsConfigsPushCall({called: false});

		checkProjectsEmitCall({called: false});

		checkProjectsLoadingHash({contains: false, projectName: projectName});
	});

	describe('when project is loading', function() {
		var projectName = 'test_project',
			projectPath = '/some/path',
			projectConfig = {someOption: 'someValue'};

		var projectConfigExtended = _({
			name: projectName,
			dir: projectPath
		}).extend(projectConfig);

		var loadingProjectsHash = {};
		loadingProjectsHash[projectName] = 1;

		before(function() {
			mocks = getMocks({
				projectPath: projectPath,
				projectsGetResult: null,
				loadConfigResult: projectConfig,
				validateConfigResult: projectConfigExtended,
				loadingProjectsHash: loadingProjectsHash
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called withot errors', function(done) {
			projects.load(projectName, done);
		});

		checkProjectsGetPathCall({projectName: projectName});

		checkProjectsGetCall({projectName: projectName});

		checkProjectsLoadConfigCall({called: false});

		checkProjectsValidateConfigCall({called: false});

		checkProjectsConfigsPushCall({called: false});

		checkProjectsEmitCall({called: false});

		checkProjectsLoadingHash({projectName: projectName});
	});
});