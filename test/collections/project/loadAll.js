'use strict';

var _ = require('underscore'),
	expect = require('expect.js'),
	sinon = require('sinon'),
	proxyquire = require('proxyquire').noCallThru();

describe('Projcts collection `loadAll` method', function() {

	var getMocks = function(params) {
		var readDirStub = sinon.stub();

		readDirStub.onCall(0).callsArgWithAsync(
			1, params.readDirError, params.projectNames
		);
		readDirStub.onCall(1).callsArgWithAsync(
			1, params.readDirError, params.archivedProjectNames
		);

		return {
			fs: {
				readdir: readDirStub
			},
			junk: {
				not: sinon.spy(_.identity)
			},
			projects: {
				baseDir: params.projectsBaseDir,
				archiveDir: params.projectsArchiveDir,
				load: sinon.stub().callsArgWithAsync(
					1, params.loadError, null
				)
			}
		};
	};

	var getProjectsCollection = function(mocks) {
		var ProjectsCollection = proxyquire(
			'../../../lib/project', _(mocks).pick('fs', 'junk')
		).ProjectsCollection;

		projects = new ProjectsCollection({});

		_(projects).extend(mocks.projects);

		return projects;
	};

	var projects, mocks;

	var checkFsReadDirCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it(
				'should call `fs.readdir` with projects base and archive dirs',
				function() {
					expect(mocks.fs.readdir.calledTwice).equal(true);
					var args = mocks.fs.readdir.getCall(0).args;
					expect(args[0]).eql(expected.projectsBaseDir);

					args = mocks.fs.readdir.getCall(1).args;
					expect(args[0]).eql(expected.projectsArchiveDir);
				}
			);
		} else {
			it('should not call `fs.readdir`', function() {
				expect(mocks.fs.readdir.called).equal(false);
			});
		}
	};

	var checkJunkNotCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			var allProjectNames = expected.projectNames.concat(
				expected.archivedProjectNames
			);

			it('should call `junk.not` for every project name', function() {
				_(allProjectNames).each(function(projectName, index) {
					var args = mocks.junk.not.getCall(index).args;
					expect(args[0]).eql(projectName);
				});
			});
		} else {
			it('should not call `junk.not`', function() {
				expect(mocks.junk.not.called).equal(false);
			});
		}
	};

	var checkProjectsLoadCall = function(expected) {
		expected.called = _(expected).has('called') ? expected.called : true;

		if (expected.called) {
			it('should call `load` for every project name', function() {
				_(expected.projectNames).each(function(projectName, index) {
					var args = mocks.projects.load.getCall(index).args;
					expect(args[0]).eql({name: projectName});
				});
			});

			it(
				'should call `load` with archived: true for every archived ' +
				'project name',
				function() {
					_(expected.archivedProjectNames).each(
						function(projectName, index) {
							var args = mocks.projects.load.getCall(
								expected.projectNames.length + index
							).args;

							expect(args[0]).eql({
								name: projectName,
								archived: true
							});
						}
					);
				}
			);
		} else {
			it('should not call `load`', function() {
				expect(mocks.projects.load.called).equal(false);
			});
		}
	};

	describe('in general', function() {
		var projectsBaseDir = '/some/path',
			projectsArchiveDir = '/another/path',
			projectNames = ['test_project', 'another_project'],
			archivedProjectNames = ['some_archived_project'];

		before(function() {
			mocks = getMocks({
				projectsBaseDir: projectsBaseDir,
				projectsArchiveDir: projectsArchiveDir,
				projectNames: projectNames,
				archivedProjectNames: archivedProjectNames
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called witout errors', function(done) {
			projects.loadAll(done);
		});

		checkFsReadDirCall({
			projectsBaseDir: projectsBaseDir,
			projectsArchiveDir: projectsArchiveDir
		});

		checkJunkNotCall({
			projectNames: projectNames,
			archivedProjectNames: archivedProjectNames
		});

		checkProjectsLoadCall({
			projectNames: projectNames,
			archivedProjectNames: archivedProjectNames
		});
	});

	describe('when `fs.readdir` throws error', function() {
		var projectsBaseDir = '/some/path',
			projectsArchiveDir = '/another/path',
			projectNames = ['test_project', 'another_project'],
			archivedProjectNames = ['some_archived_project'],
			readDirError = new Error('some error');

		before(function() {
			mocks = getMocks({
				projectsBaseDir: projectsBaseDir,
				projectsArchiveDir: projectsArchiveDir,
				readDirError: readDirError
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called with error', function(done) {
			projects.loadAll(function(err) {
				expect(err).equal(readDirError);
				done();
			});
		});

		checkFsReadDirCall({
			projectsBaseDir: projectsBaseDir,
			projectsArchiveDir: projectsArchiveDir
		});

		checkJunkNotCall({called: false});

		checkProjectsLoadCall({called: false});
	});

	describe('when `load` throws error', function() {
		var projectsBaseDir = '/some/path',
			projectsArchiveDir = '/another/path',
			projectNames = ['test_project', 'another_project'],
			archivedProjectNames = ['some_archived_project'],
			loadError = new Error('some error');

		before(function() {
			mocks = getMocks({
				projectsBaseDir: projectsBaseDir,
				projectsArchiveDir: projectsArchiveDir,
				projectNames: projectNames,
				archivedProjectNames: archivedProjectNames,
				loadError: loadError
			});

			projects = getProjectsCollection(mocks);
		});

		it('should be called with error', function(done) {
			projects.loadAll(function(err) {
				expect(err).equal(loadError);
				done();
			});
		});

		checkFsReadDirCall({
			projectsBaseDir: projectsBaseDir,
			projectsArchiveDir: projectsArchiveDir
		});

		checkJunkNotCall({
			projectNames: projectNames,
			archivedProjectNames: archivedProjectNames
		});

		checkProjectsLoadCall({
			projectNames: projectNames,
			archivedProjectNames: archivedProjectNames
		});
	});

});
