'use strict';

var _ = require('underscore'),
	expect = require('expect.js'),
	sinon = require('sinon'),
	proxyquire = require('proxyquire').noCallThru();

describe('Projcts collection `rename` method', function() {

	var getMocks = function(params) {
		return {
			projects: {
				get: sinon.stub().returns(params.getResult),
				unload: sinon.stub().callsArgWithAsync(1, null),
				_getProjectPath: sinon.stub().returns(
					params.getProjectPathResult
				),
				db: {
					builds: {
						multiUpdate: sinon.stub().callsArgWithAsync(2, null)
					}
				},
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
				'should call `_getProjectPath` with new project name ' +
				'and archived ' + String(expected.archived),
				function() {
					expect(mocks.projects._getProjectPath.calledOnce).equal(true);
					var args = mocks.projects._getProjectPath.getCall(0).args;
					expect(args[0]).eql({
						name: expected.newProjectName,
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

	var checkDbBuildsMultiupdateCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it('should call `db.builds.multiUpdate` with project name', function() {
				expect(mocks.projects.db.builds.multiUpdate.calledOnce).equal(true);
				var args = mocks.projects.db.builds.multiUpdate.getCall(0).args;
				expect(args[0]).eql({
					start: {projectName: expected.projectName, descCreateDate: ''}
				});
			});
		} else {
			it('should not call `db.builds.multiUpdate`', function() {
				expect(mocks.projects.db.builds.multiUpdate.called).equal(false);
			});
		}
	};

	var checkProjectsLoadCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it(
				'should call `load` with new project name and archived ' +
				String(expected.archived),
				function() {
					expect(mocks.projects.load.calledOnce).equal(true);
					var args = mocks.projects.load.getCall(0).args;
					expect(args[0]).eql({
						name: expected.newProjectName,
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

	describe('with suitable params', function() {
		var projectName = 'test_project',
			projectPath = '/some/path',
			project = {name: projectName, dir: projectPath, archived: false},
			newProjectName = 'test_project_new',
			newProjectPath = '/new/project/path';

		before(function() {
			mocks = getMocks({
				getResult: project,
				getProjectPathResult: newProjectPath
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called without errors', function(done) {
			projects.rename({
				name: projectName,
				newName: newProjectName
			}, done);
		});

		checkProjectsGetCall({projectName: projectName});

		checkProjectsUnloadCall({projectName: projectName});

		checkProjectsGetPathCall({
			newProjectName: newProjectName,
			archived: project.archived
		});

		checkFsRenameCall({
			projectPath: project.dir,
			newProjectPath: newProjectPath
		});

		checkDbBuildsMultiupdateCall({projectName: projectName});

		checkProjectsLoadCall({
			newProjectName: newProjectName,
			archived: project.archived
		});
	});

	describe('with suitable params and archived project', function() {
		var projectName = 'test_project',
			projectPath = '/some/path',
			project = {name: projectName, dir: projectPath, archived: true},
			newProjectName = 'test_project_new',
			newProjectPath = '/new/project/path';

		before(function() {
			mocks = getMocks({
				getResult: project,
				getProjectPathResult: newProjectPath
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called without errors', function(done) {
			projects.rename({
				name: projectName,
				newName: newProjectName
			}, done);
		});

		checkProjectsGetCall({projectName: projectName});

		checkProjectsUnloadCall({projectName: projectName});

		checkProjectsGetPathCall({
			newProjectName: newProjectName,
			archived: project.archived
		});

		checkFsRenameCall({
			projectPath: project.dir,
			newProjectPath: newProjectPath
		});

		checkDbBuildsMultiupdateCall({projectName: projectName});

		checkProjectsLoadCall({
			newProjectName: newProjectName,
			archived: project.archived
		});
	});

	describe('when project name is not set', function() {
		var projectName = null,
			projectPath = '/some/path',
			project = {name: projectName, dir: projectPath, archived: false},
			newProjectName = 'test_project_new',
			newProjectPath = '/new/project/path';

		before(function() {
			mocks = getMocks({
				getResult: project,
				getProjectPathResult: newProjectPath
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called with error', function(done) {
			projects.rename({
				name: projectName,
				newName: newProjectName
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

		checkDbBuildsMultiupdateCall({called: false});

		checkProjectsLoadCall({called: false});
	});

	describe('when new project name is not set', function() {
		var projectName = 'test_project',
			projectPath = '/some/path',
			project = {name: projectName, dir: projectPath, archived: false},
			newProjectName = null,
			newProjectPath = '/new/project/path';

		before(function() {
			mocks = getMocks({
				getResult: project,
				getProjectPathResult: newProjectPath
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called with error', function(done) {
			projects.rename({
				name: projectName,
				newName: newProjectName
			}, function(err) {
				expect(err).an(Error);
				expect(err.message).eql('Project new name is required');

				done();
			});
		});

		checkProjectsGetCall({called: false});

		checkProjectsUnloadCall({called: false});

		checkProjectsGetPathCall({called: false});

		checkFsRenameCall({called: false});

		checkDbBuildsMultiupdateCall({called: false});

		checkProjectsLoadCall({called: false});
	});

	describe('when project is not loaded', function() {
		var projectName = 'test_project',
			projectPath = '/some/path',
			project = null,
			newProjectName = 'test_project_new',
			newProjectPath = '/new/project/path';

		before(function() {
			mocks = getMocks({
				getResult: project,
				getProjectPathResult: newProjectPath
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called with error', function(done) {
			projects.rename({
				name: projectName,
				newName: newProjectName
			}, function(err) {
				expect(err).an(Error);
				expect(err.message).eql(
					'Can`t find project "' + projectName + '" for rename'
				);

				done();
			});
		});

		checkProjectsGetCall({projectName: projectName});

		checkProjectsUnloadCall({called: false});

		checkProjectsGetPathCall({called: false});

		checkFsRenameCall({called: false});

		checkDbBuildsMultiupdateCall({called: false});

		checkProjectsLoadCall({called: false});
	});
});
