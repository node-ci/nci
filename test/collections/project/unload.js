'use strict';

var _ = require('underscore'),
	expect = require('expect.js'),
	sinon = require('sinon'),
	path = require('path');

describe('Projcts collection `unload` method', function() {

	var getMocks = function(params) {
		return {
			projects: {
				configs: params.configs,
				emit: sinon.stub()
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

	describe('with loaded project', function() {
		var projectName = 'test_project',
			projectConfig = {name: projectName},
			configs = [
				projectConfig,
				{name: 'another_project'}
			];

		before(function() {
			mocks = getMocks({
				configs: _(configs).map(function(config) {
					return _(config).clone();
				})
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called witout errors', function(done) {
			projects.unload(projectName, done);
		});

		it('should not contain project config in configs', function() {
			var expectedConfigs = _(configs).filter(function(config) {
				return config.name !== projectName;
			});

			expect(projects.configs).eql(expectedConfigs);
		});

		checkProjectsEmitCall({
			eventName: 'projectUnloaded',
			config: projectConfig
		});
	});

	describe('with not loaded project', function() {
		var projectName = 'test_project',
			configs = [
				{name: 'some_project'},
				{name: 'another_project'}
			];

		before(function() {
			mocks = getMocks({
				configs: _(configs).map(function(config) {
					return _(config).clone();
				})
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called with error', function(done) {
			projects.unload(projectName, function(err) {
				expect(err).an(Error);
				expect(err.message).eql(
					'Can`t unload not loaded project: "' + projectName + '"'
				);
				done();
			});
		});

		it('should not modify configs', function() {
			expect(projects.configs).eql(configs);
		});

		checkProjectsEmitCall({called: false});
	});

});
