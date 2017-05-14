'use strict';

var _ = require('underscore'),
	expect = require('expect.js'),
	sinon = require('sinon'),
	utils = require('../../../lib/utils');

describe('Projcts collection `loadConfig` method', function() {

	var getMocks = function(params) {
		return {
			projects: {
				reader: {
					load: sinon.stub().callsArgWithAsync(
						2, params.loadError, params.loadResult
					)
				}
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

	var checkReaderLoadCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it('should call `reader.load` with project path', function() {
				expect(mocks.projects.reader.load.calledOnce).equal(true);
				var args = mocks.projects.reader.load.getCall(0).args;
				expect(args[0]).eql(expected.projectPath);
				expect(args[1]).eql('config');
			});
		} else {
			it('should not call `reader.load`', function() {
				expect(mocks.projects.reader.load.called).equal(false);
			});
		}
	};

	var longCmd = 'echo ' + _(40).range().join('');

	describe('with config in normalized format', function() {
		var projectPath = '/some/path',
			projectConfig = {
				steps: [
					{type: 'shell', cmd: 'echo 1'},
					{type: 'shell', cmd: longCmd}
				]
			},
			loadedProjectConfig;

		var expectedProjectConfig = {
			steps: [
				{
					name: utils.prune(projectConfig.steps[0].cmd, 40),
					cmd: 'echo 1',
					type: 'shell'
				},
				{
					name: utils.prune(projectConfig.steps[1].cmd, 40),
					cmd: longCmd,
					type: 'shell'
				}
			]
		};

		before(function() {
			mocks = getMocks({
				loadResult: {
					steps: _(projectConfig.steps).map(function(step) {
						return _(step).clone();
					})
				}
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called without errors', function(done) {
			projects._loadConfig(projectPath, function(err, result) {
				expect(err).not.ok();
				loadedProjectConfig = result;
				done();
			});
		});

		checkReaderLoadCall({projectPath: projectPath});

		it('should return original project config with added names', function() {
			expect(loadedProjectConfig).eql(expectedProjectConfig);
		});
	});

	describe('with config with steps as object', function() {
		var projectPath = '/some/path',
			projectConfig = {
				steps: {
					'echo 1': 'echo 1',
					'echo 2': {cmd: longCmd}
				}
			},
			loadedProjectConfig;

		var expectedProjectConfig = {
			steps: [
				{name: 'echo 1', cmd: 'echo 1', type: 'shell'},
				{name: 'echo 2', cmd: longCmd, type: 'shell'}
			]
		};

		before(function() {
			mocks = getMocks({
				loadResult: {
					steps: _(projectConfig.steps).clone()
				}
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called without errors', function(done) {
			projects._loadConfig(projectPath, function(err, result) {
				expect(err).not.ok();
				loadedProjectConfig = result;
				done();
			});
		});

		checkReaderLoadCall({projectPath: projectPath});

		it('should return normalized project config', function() {
			expect(loadedProjectConfig).eql(expectedProjectConfig);
		});
	});

	describe('when error on reader load', function() {
		var projectPath = '/some/path',
			projectConfig = {},
			loadError = new Error('some error');

		before(function() {
			mocks = getMocks({
				loadError: loadError
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called with error', function(done) {
			projects._loadConfig(projectPath, function(err) {
				expect(err).equal(loadError);
				done();
			});
		});

		checkReaderLoadCall({projectPath: projectPath});

	});

});
