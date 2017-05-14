'use strict';

var _ = require('underscore'),
	expect = require('expect.js'),
	sinon = require('sinon'),
	proxyquire = require('proxyquire').noCallThru();

describe('Projcts collection `unarchive` method', function() {

	var getMocks = function(params) {
		return {
			projects: {
				_archiveUnarchive: sinon.stub().callsArgWithAsync(
					1, params.archiveUnarchiveError
				)
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

	var checkProjectsArchiveUnarchiveCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it(
				'should call `_archiveUnarchive` with project name and ' +
				expected.action + ' action',
				function() {
					expect(mocks.projects._archiveUnarchive.calledOnce).equal(true);
					var args = mocks.projects._archiveUnarchive.getCall(0).args;
					expect(args[0]).eql({
						name: expected.projectName,
						action: expected.action
					});
				}
			);
		} else {
			it('should not call `_archiveUnarchive`', function() {
				expect(mocks.projects._archiveUnarchive.called).equal(false);
			});
		}
	};

	describe('in general', function() {
		var projectName = 'test_project';

		before(function() {
			mocks = getMocks({});

			projects = getProjectsCollection(mocks);
		});

		it('should be called without errors', function(done) {
			projects.unarchive({name: projectName}, done);
		});

		checkProjectsArchiveUnarchiveCall({
			projectName: projectName,
			action: 'unarchive'
		});
	});

	describe('with `_archiveUnarchive` error', function() {
		var projectName = 'test_project',
			archiveUnarchiveError = new Error('some error');

		before(function() {
			mocks = getMocks({
				archiveUnarchiveError: archiveUnarchiveError
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called with error', function(done) {
			projects.unarchive({name: projectName}, function(err) {
				expect(err).equal(archiveUnarchiveError);

				done();
			});
		});

		checkProjectsArchiveUnarchiveCall({
			projectName: projectName,
			action: 'unarchive'
		});
	});
});
