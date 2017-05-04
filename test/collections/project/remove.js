'use strict';

var _ = require('underscore'),
	expect = require('expect.js'),
	sinon = require('sinon'),
	proxyquire = require('proxyquire').noCallThru(),
	path = require('path');

describe('Projcts collection `remove` method', function() {

	var getMocks = function(params) {
		function SpawnCommand() {
		}

		SpawnCommand.prototype.run = sinon.stub().callsArgWithAsync(
			1, null, null
		);

		return {
			projects: {
				_getProjectPath: sinon.stub().returns(
					params.getProjectPathResult
				),
				db: {
					builds: {
						find: sinon.stub().callsArgWithAsync(
							1, null, params.buildsFindResult
						),
						del: sinon.stub().callsArgWithAsync(
							1, null, null
						)
					},
					logLines: {
						remove: sinon.stub().callsArgWithAsync(
							1, null, null
						)
					}
				},
				unload: sinon.stub().callsArgWithAsync(
					1, null, null
				)
			},
			'./command/spawn': {
				Command: SpawnCommand
			}
		};
	};

	var getProjectsCollection = function(mocks) {
		var ProjectsCollection = proxyquire(
			'../../../lib/project', _(mocks).pick('./command/spawn')
		).ProjectsCollection;

		projects = new ProjectsCollection({});

		_(projects).extend(mocks.projects);

		return projects;
	};

	var projects, mocks;

	var checkDbBuildsFindCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it('should call `db.builds.find` with project name', function() {
				expect(mocks.projects.db.builds.find.calledOnce).equal(true);
				var args = mocks.projects.db.builds.find.getCall(0).args;
				expect(args[0]).eql({
					start: {projectName: expected.projectName, descCreateDate: ''}
				});
			});
		} else {
			it('should not call `db.builds.find`', function() {
				expect(mocks.projects.db.builds.find.called).equal(false);
			});
		}
	};

	var checkCommandRunCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it('should call `SpawnCommand run` with project path', function() {
				var runMock = mocks['./command/spawn'].Command.prototype.run;
				expect(runMock.calledOnce).equal(true);
				var args = runMock.getCall(0).args;
				expect(args[0]).eql({
					cmd: expected.cmd,
					args: expected.args
				});
			});
		} else {
			it('should not call `SpawnCommand run`', function() {
				var runMock = mocks['./command/spawn'].Command.prototype.run;
				expect(runMock.called).equal(false);
			});
		}
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

	var checkDbBuildsDelCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it('should call `db.builds.del` with builds', function() {
				expect(mocks.projects.db.builds.del.calledOnce).equal(true);
				var args = mocks.projects.db.builds.del.getCall(0).args;
				expect(args[0]).eql(expected.builds);
			});
		} else {
			it('should not call `db.builds.del`', function() {
				expect(mocks.projects.db.builds.del.called).equal(false);
			});
		}
	};

	var checkDbLogLinesRemoveCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it('should call `db.logLines.remove` for each build', function() {
				expect(mocks.projects.db.logLines.remove.callCount).equal(
					expected.builds.length
				);
				_(expected.builds).each(function(build, index) {
					var args = mocks.projects.db.logLines.remove.getCall(index).args;
					expect(args[0]).eql({
						start: {buildId: build.id}
					});
				});
			});
		} else {
			it('should not call `db.logLines.remove`', function() {
				expect(mocks.projects.db.logLines.remove.called).equal(false);
			});
		}
	};

	describe('with project with builds', function() {
		var projectName = 'test_project',
			projectPath = '/some/path',
			builds = [{id: 1}, {id: 2}];

		before(function() {
			mocks = getMocks({
				buildsFindResult: builds,
				getProjectPathResult: projectPath
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called witout errors', function(done) {
			projects.remove(projectName, done);
		});

		checkDbBuildsFindCall({projectName: projectName});

		checkCommandRunCall({cmd: 'rm', args: ['-Rf', projectPath]});

		checkProjectsUnloadCall({projectName: projectName});

		checkDbBuildsDelCall({builds: builds});

		checkDbLogLinesRemoveCall({builds: builds});
	});

	describe('with project without builds', function() {
		var projectName = 'test_project',
			projectPath = '/some/path',
			builds = [];

		before(function() {
			mocks = getMocks({
				buildsFindResult: builds,
				getProjectPathResult: projectPath
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called witout errors', function(done) {
			projects.remove(projectName, done);
		});

		checkDbBuildsFindCall({projectName: projectName});

		checkCommandRunCall({cmd: 'rm', args: ['-Rf', projectPath]});

		checkProjectsUnloadCall({projectName: projectName});

		checkDbBuildsDelCall({called: false});

		checkDbLogLinesRemoveCall({called: false});
	});

});
