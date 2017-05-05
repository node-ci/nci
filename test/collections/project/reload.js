'use strict';

var _ = require('underscore'),
	expect = require('expect.js'),
	sinon = require('sinon');

describe('Projcts collection `reload` method', function() {

	var getMocks = function(params) {
		return {
			projects: {
				get: sinon.stub().returns(params.projectsGetResult),
				unload: sinon.stub().callsArgWithAsync(1, null),
				load: sinon.stub().callsArgWithAsync(1, null)
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

	var checkProjectsGetCall = function(expected) {
		it('should call `get` with project name', function() {
			expect(mocks.projects.get.calledOnce).equal(true);
			var args = mocks.projects.get.getCall(0).args;
			expect(args[0]).eql(expected.projectName);
		});
	};

	var checkProjectsUnloadCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it('should call `unload` with project name', function() {
				expect(mocks.projects.unload.calledOnce).equal(true);
				var args = mocks.projects.unload.getCall(0).args;
				expect(args[0]).eql(expected.projectName);
			});
		} else {
			it('should not call `unload`', function() {
				expect(mocks.projects.unload.called).equal(false);
			});
		}
	};

	var checkProjectsLoadCall = function(expected) {
		it('should call `load` with project name', function() {
			expect(mocks.projects.load.calledOnce).equal(true);
			var args = mocks.projects.load.getCall(0).args;
			expect(args[0]).eql(expected.projectName);
		});
	};

	describe('when project already loaded', function() {
		var projectName = 'test_project';

		before(function() {
			mocks = getMocks({
				projectsGetResult: projectName
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called witout errors', function(done) {
			projects.reload(projectName, done);
		});

		checkProjectsGetCall({projectName: projectName});

		checkProjectsUnloadCall({projectName: projectName});

		checkProjectsLoadCall({projectName: projectName});
	});

	describe('when project not previously loaded', function() {
		var projectName = 'test_project';

		before(function() {
			mocks = getMocks({
				projectsGetResult: null
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called witout errors', function(done) {
			projects.reload(projectName, done);
		});

		checkProjectsGetCall({projectName: projectName});

		checkProjectsUnloadCall({called: false});

		checkProjectsLoadCall({projectName: projectName});
	});

});
