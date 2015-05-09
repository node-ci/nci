'use strict';

var expect = require('expect.js'),
	path = require('path'),
	fs = require('fs'),
	createExecutor = require('../lib/executor').createExecutor,
	SpawnCommand = require('../lib/command/spawn').Command;


['local'].forEach(function(type) {
	describe(type + ' executor', function() {
		var workspacePath = path.join(__dirname, 'workspace');

		function rmdir(dir, callback) {
			new SpawnCommand().run({cmd: 'rm', args: ['-R', dir]}, callback);
		}

		it('remove test workspace dir if it exists', function(done) {
			if (fs.exists(workspacePath, function(isExists) {
				if (isExists) {
					rmdir(workspacePath, done);
				} else {
					done();
				}
			}));
		});

		var executor;

		it('instance should be created without errors', function() {
			executor = createExecutor({
				type: type,
				project: {
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
				}
			});
		});

		it('should run', function() {
			executor.run({}, function(err) {
				expect(err).not.ok();
			});
		});

		it('should emit scm data', function(done) {
			executor.on('scmData', function(scmData) {
				expect(scmData).have.keys('rev', 'changes');
				done();
			});
		});

	});
});
