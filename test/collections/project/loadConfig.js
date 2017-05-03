'use strict';

var _ = require('underscore'),
	expect = require('expect.js'),
	sinon = require('sinon'),
	path = require('path');

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

	describe('with config in ordinary format', function() {
		var projectPath = '/some/path',
			projectConfig = {someOption: 'someValue'},
			loadedProjectConfig;

		before(function() {
			mocks = getMocks({
				loadResult: projectConfig
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called witout errors', function(done) {
			projects._loadConfig(projectPath, function(err, result) {
				expect(err).not.ok();
				loadedProjectConfig = result;
				done();
			});
		});

		checkReaderLoadCall({projectPath: projectPath});

		it('should return false', function() {
			expect(loadedProjectConfig).eql(projectConfig);
		});
	});

});