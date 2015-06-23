'use strict';

var expect = require('expect.js'),
	path = require('path'),
	fs = require('fs'),
	createExecutor = require('../lib/executor').createExecutor,
	SpawnCommand = require('../lib/command/spawn').Command,
	_ = require('underscore'),
	mercurialRevs = _(require('./helpers').mercurialRevs).clone();


['local'].forEach(function(type) {
	describe(type + ' executor', function() {
		var workspacePath = path.join(__dirname, 'workspace');

		var removeDir = function (dir, callback) {
			new SpawnCommand().run({cmd: 'rm', args: ['-R', dir]}, callback);
		}

		var clearWorkspace = function (done) {
			if (fs.exists(workspacePath, function(isExists) {
				if (isExists) {
					removeDir(workspacePath, done);
				} else {
					done();
				}
			}));
		}

		var makeExecutorParams = function(params) {
			params = params || {};
			return {
				type: type,
				project: _({
					dir: __dirname,
					name: 'test project',
					scm: {
						type: 'mercurial',
						repository: path.join(__dirname, 'repos', 'mercurial'),
						rev: 'default'
					},
					steps: [
						{type: 'shell', cmd: 'echo 1'},
						{type: 'shell', cmd: 'echo 2'}
					]
				}).extend(params.project)
			};
		};

		var executor, scmData;

		describe('with scm rev default and without catch rev', function() {
			before(clearWorkspace);

			it('instance should be created without errors', function() {
				executor = createExecutor(makeExecutorParams());
			});

			it('should run without errors', function(done) {
				executor.run({}, function(err) {
					expect(err).not.ok();
					done();
				});
				executor.on('scmData', function(data) {
					scmData = data;
				});
			});

			it('scm data should be rev: 2, changes: [0-2], latest', function() {
				expect(scmData).eql({
					rev: mercurialRevs[2],
					changes: mercurialRevs.slice().reverse(),
					isLatest: true
				});
			});
		});

		describe('with scm rev default and catch rev "first revision"', function() {
			before(clearWorkspace);

			it('instance should be created without errors', function() {
				executor = createExecutor(makeExecutorParams({
					project: {
						catchRev: {comment: 'first revision'}
					}
				}));
			});

			it('should run without errors', function(done) {
				executor.run({}, function(err) {
					expect(err).not.ok();
					done();
				});
				executor.on('scmData', function(data) {
					scmData = data;
				});
			});

			it('scm data should be rev: 1, changes: [0, 1], not latest',
				function() {
					expect(scmData).eql({
						rev: mercurialRevs[1],
						changes: mercurialRevs.slice(0, 2).reverse(),
						isLatest: false
					});
				});

			it('should run it again without errors', function(done) {
				executor.run({}, done);
			});

			it('scm data should be rev: 2, changes: [2], latest', function() {
				expect(scmData).eql({
					rev: mercurialRevs[2],
					changes: mercurialRevs.slice(2, 3).reverse(),
					isLatest: true
				});
			});
		});

	});

});
