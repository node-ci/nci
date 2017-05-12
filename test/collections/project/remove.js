'use strict';

var _ = require('underscore'),
	expect = require('expect.js'),
	sinon = require('sinon'),
	proxyquire = require('proxyquire').noCallThru();

describe('Projcts collection `remove` method', function() {

	var getMocks = function(params) {
		function SpawnCommand() {
		}

		SpawnCommand.prototype.run = sinon.stub().callsArgWithAsync(
			1, null, null
		);

		return {
			projects: {
				get: sinon.stub().returns(
					params.getResult
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
				expect(args[0]).eql({name: expected.projectName});
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
			project = {name: projectName, dir: projectPath},
			builds = [{id: 1}, {id: 2}];

		before(function() {
			mocks = getMocks({
				getResult: project,
				buildsFindResult: builds
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called witout errors', function(done) {
			projects.remove({name: projectName}, done);
		});

		checkProjectsGetCall({projectName: projectName});

		checkDbBuildsFindCall({projectName: projectName});

		checkCommandRunCall({cmd: 'rm', args: ['-Rf', project.dir]});

		checkProjectsUnloadCall({projectName: projectName});

		checkDbBuildsDelCall({builds: builds});

		checkDbLogLinesRemoveCall({builds: builds});
	});

	describe('with project without builds', function() {
		var projectName = 'test_project',
			projectPath = '/some/path',
			project = {name: projectName, dir: projectPath},
			builds = [];

		before(function() {
			mocks = getMocks({
				getResult: project,
				buildsFindResult: builds
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called witout errors', function(done) {
			projects.remove({name: projectName}, done);
		});

		checkProjectsGetCall({projectName: projectName});

		checkDbBuildsFindCall({projectName: projectName});

		checkCommandRunCall({cmd: 'rm', args: ['-Rf', project.dir]});

		checkProjectsUnloadCall({projectName: projectName});

		checkDbBuildsDelCall({called: false});

		checkDbLogLinesRemoveCall({called: false});
	});

	describe('with archived project with builds', function() {
		var projectName = 'test_project',
			projectPath = '/some/path',
			project = {name: projectName, dir: projectPath, archived: true},
			builds = [{id: 1}, {id: 2}];

		before(function() {
			mocks = getMocks({
				getResult: project,
				buildsFindResult: builds
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called witout errors', function(done) {
			projects.remove({name: projectName}, done);
		});

		checkProjectsGetCall({projectName: projectName});

		checkDbBuildsFindCall({projectName: projectName});

		checkCommandRunCall({cmd: 'rm', args: ['-Rf', project.dir]});

		checkProjectsUnloadCall({projectName: projectName});

		checkDbBuildsDelCall({builds: builds});

		checkDbLogLinesRemoveCall({builds: builds});
	});

	describe('when project name is not set', function() {
		var projectName = null,
			projectPath = '/some/path',
			project = {name: projectName, dir: projectPath},
			builds = [];

		before(function() {
			mocks = getMocks({
				getResult: project,
				buildsFindResult: builds
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called with error', function(done) {
			projects.remove({name: projectName}, function(err) {
				expect(err).an(Error);
				expect(err.message).eql('Project name is required');

				done();
			});
		});

		checkProjectsGetCall({called: false});

		checkDbBuildsFindCall({called: false});

		checkCommandRunCall({called: false});

		checkProjectsUnloadCall({called: false});

		checkDbBuildsDelCall({called: false});

		checkDbLogLinesRemoveCall({called: false});
	});

	describe('when project doesn`t exist', function() {
		var projectName = 'test_project',
			projectPath = '/some/path',
			project = null,
			builds = [];

		before(function() {
			mocks = getMocks({
				getResult: project,
				buildsFindResult: builds
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called with error', function(done) {
			projects.remove({name: projectName}, function(err) {
				expect(err).an(Error);
				expect(err.message).eql(
					'Can`t find project "' + projectName + '" for removing'
				);

				done();
			});
		});

		checkProjectsGetCall({projectName: projectName});

		checkDbBuildsFindCall({called: false});

		checkCommandRunCall({called: false});

		checkProjectsUnloadCall({called: false});

		checkDbBuildsDelCall({called: false});

		checkDbLogLinesRemoveCall({called: false});
	});

});
