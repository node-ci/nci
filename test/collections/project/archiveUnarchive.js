'use strict';

var _ = require('underscore'),
	expect = require('expect.js'),
	sinon = require('sinon'),
	proxyquire = require('proxyquire').noCallThru();

describe('Projcts collection `_archiveUnarchive` method', function() {

	var getMocks = function(params) {
		return {
			projects: {
				get: sinon.stub().returns(params.getResult),
				_getProjectPath: sinon.stub().returns(
					params.getProjectPathResult
				),
				unload: sinon.stub().callsArgWithAsync(1, null),
				load: sinon.stub().callsArgWithAsync(1, null)
			},
			fs: {
				rename: sinon.stub().callsArgWithAsync(
					2, params.renameError
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

	var checkProjectsUnloadCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it('should call `unload` with project name', function() {
				expect(mocks.projects.unload.calledOnce).equal(true);
				var args = mocks.projects.unload.getCall(0).args;
				expect(args[0]).eql({name: expected.projectName});
			});
		} else {
			it('should not call `unload`', function() {
				expect(mocks.projects.unload.called).equal(false);
			});
		}
	};

	var checkProjectsGetPathCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it(
				'should call `_getProjectPath` with project name ' +
				'and archived ' + String(expected.archived),
				function() {
					expect(mocks.projects._getProjectPath.calledOnce).equal(true);
					var args = mocks.projects._getProjectPath.getCall(0).args;
					expect(args[0]).eql({
						name: expected.projectName,
						archived: expected.archived
					});
				}
			);
		} else {
			it('should not call `_getProjectPath`', function() {
				expect(mocks.projects._getProjectPath.called).equal(false);
			});
		}
	};

	var checkFsRenameCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it('should call `fs.rename` with current and new path', function() {
				expect(mocks.fs.rename.calledOnce).equal(true);
				var args = mocks.fs.rename.getCall(0).args;
				expect(args[0]).eql(expected.projectPath);
				expect(args[1]).eql(expected.newProjectPath);
			});
		} else {
			it('should not call `fs.rename`', function() {
				expect(mocks.fs.rename.called).equal(false);
			});
		}
	};

	var checkProjectsLoadCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it(
				'should call `load` with project name and archived ' +
				String(expected.archived),
				function() {
					expect(mocks.projects.load.calledOnce).equal(true);
					var args = mocks.projects.load.getCall(0).args;
					expect(args[0]).eql({
						name: expected.projectName,
						archived: expected.archived
					});
				}
			);
		} else {
			it('should not call `load`', function() {
				expect(mocks.projects.load.called).equal(false);
			});
		}
	};

	describe('with archive action and suitable params', function() {
		var projectName = 'test_project',
			projectPath = '/some/path',
			project = {name: projectName, dir: projectPath},
			newProjectPath = '/archived/project/path';

		before(function() {
			mocks = getMocks({
				getResult: project,
				getProjectPathResult: newProjectPath
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called without errors', function(done) {
			projects._archiveUnarchive({
				name: projectName,
				action: 'archive'
			}, done);
		});

		checkProjectsGetCall({projectName: projectName});

		checkProjectsUnloadCall({projectName: projectName});

		checkProjectsGetPathCall({projectName: projectName, archived: true});

		checkFsRenameCall({
			projectPath: projectPath,
			newProjectPath: newProjectPath
		});

		checkProjectsLoadCall({projectName: projectName, archived: true});
	});

	describe('with unarchive action and suitable params', function() {
		var projectName = 'test_project',
			projectPath = '/archived/project/path',
			project = {name: projectName, dir: projectPath, archived: true},
			newProjectPath = '/some/path';

		before(function() {
			mocks = getMocks({
				getResult: project,
				getProjectPathResult: newProjectPath
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called without errors', function(done) {
			projects._archiveUnarchive({
				name: projectName,
				action: 'unarchive'
			}, done);
		});

		checkProjectsGetCall({projectName: projectName});

		checkProjectsUnloadCall({projectName: projectName});

		checkProjectsGetPathCall({projectName: projectName, archived: false});

		checkFsRenameCall({
			projectPath: projectPath,
			newProjectPath: newProjectPath
		});

		checkProjectsLoadCall({projectName: projectName, archived: false});
	});

	describe('with unknown action', function() {
		var projectName = 'test_project',
			projectPath = '/some/path',
			project = {name: projectName, dir: projectPath},
			newProjectPath = '/archived/project/path',
			action = 'doIt';

		before(function() {
			mocks = getMocks({
				getResult: project,
				getProjectPathResult: newProjectPath
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called with error', function(done) {
			projects._archiveUnarchive({
				name: projectName,
				action: action
			}, function(err) {
				expect(err).an(Error);
				expect(err.message).eql('Unknown action: ' + action);

				done();
			});
		});

		checkProjectsGetCall({projectName: projectName});

		checkProjectsUnloadCall({called: false});

		checkProjectsGetPathCall({called: false});

		checkFsRenameCall({called: false});

		checkProjectsLoadCall({called: false});
	});

	describe('when project name is not set', function() {
		var projectName = null,
			projectPath = '/some/path',
			project = {name: projectName, dir: projectPath},
			newProjectPath = '/archived/project/path';

		before(function() {
			mocks = getMocks({
				getResult: project,
				getProjectPathResult: newProjectPath
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called with error', function(done) {
			projects._archiveUnarchive({
				name: projectName,
				action: 'archive'
			}, function(err) {
				expect(err).an(Error);
				expect(err.message).eql('Project name is required');

				done();
			});
		});

		checkProjectsGetCall({called: false});

		checkProjectsUnloadCall({called: false});

		checkProjectsGetPathCall({called: false});

		checkFsRenameCall({called: false});

		checkProjectsLoadCall({called: false});
	});

	describe('when project is not loaded', function() {
		var projectName = 'test_project',
			projectPath = '/some/path',
			project = null,
			newProjectPath = '/archived/project/path',
			action = 'archive';

		before(function() {
			mocks = getMocks({
				getResult: project,
				getProjectPathResult: newProjectPath
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called with error', function(done) {
			projects._archiveUnarchive({
				name: projectName,
				action: action
			}, function(err) {
				expect(err).an(Error);
				expect(err.message).eql(
					'Can`t find project "' + projectName + '" for ' + action
				);

				done();
			});
		});

		checkProjectsGetCall({projectName: projectName});

		checkProjectsUnloadCall({called: false});

		checkProjectsGetPathCall({called: false});

		checkFsRenameCall({called: false});

		checkProjectsLoadCall({called: false});
	});

	describe('when archive already archived project', function() {
		var projectName = 'test_project',
			projectPath = '/some/path',
			project = {name: projectName, dir: projectPath, archived: true},
			newProjectPath = '/archived/project/path',
			action = 'archive';

		before(function() {
			mocks = getMocks({
				getResult: project,
				getProjectPathResult: newProjectPath
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called with error', function(done) {
			projects._archiveUnarchive({
				name: projectName,
				action: action
			}, function(err) {
				expect(err).an(Error);
				expect(err.message).eql(
					'Project "' + projectName + '" already archived'
				);

				done();
			});
		});

		checkProjectsGetCall({projectName: projectName});

		checkProjectsUnloadCall({called: false});

		checkProjectsGetPathCall({called: false});

		checkFsRenameCall({called: false});

		checkProjectsLoadCall({called: false});
	});

	describe('when unarchive not archived project', function() {
		var projectName = 'test_project',
			projectPath = '/some/path',
			project = {name: projectName, dir: projectPath},
			newProjectPath = '/archived/project/path',
			action = 'unarchive';

		before(function() {
			mocks = getMocks({
				getResult: project,
				getProjectPathResult: newProjectPath
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called with error', function(done) {
			projects._archiveUnarchive({
				name: projectName,
				action: action
			}, function(err) {
				expect(err).an(Error);
				expect(err.message).eql(
					'Project "' + projectName + '" is not archived'
				);

				done();
			});
		});

		checkProjectsGetCall({projectName: projectName});

		checkProjectsUnloadCall({called: false});

		checkProjectsGetPathCall({called: false});

		checkFsRenameCall({called: false});

		checkProjectsLoadCall({called: false});
	});

});
