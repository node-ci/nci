'use strict';

var expect = require('expect.js'),
	ShellCommand = require('../../lib/command/shell').Command;

describe('Shell command', function() {

	var shellCommand;
	it('Should be created without errors', function() {
		shellCommand = new ShellCommand({
			emitOut: true,
			attachStderr: true
		});
	});

	var defaultShell = process.platform === 'win32' ? 'cmd' : '/bin/sh';

	it('Default shell should be ' + defaultShell, function() {
		expect(shellCommand.shell).equal(defaultShell);
	});

	var defaultShellCmdArg = process.platform === 'win32' ? '/C' : '-c';

	it('Default shell cmd arg should ' + defaultShellCmdArg, function() {
		expect(shellCommand.shellCmdArg).equal(defaultShellCmdArg);
	});

	var collectData = function(result, field) {
		return function(data) {
			result[field] += data;
		};
	};

	var std = {out: '', err: ''};
	it('echo "Hello world" should be done', function(done) {
		shellCommand.on('stdout', collectData(std, 'out'));
		shellCommand.on('stderr', collectData(std, 'err'));
		shellCommand.run({cmd: 'echo "Hello world1"'}, function(err) {
			expect(err).not.ok();
			expect(std.err).equal('');
			expect(std.out).equal('Hello world1\n');
			done();
		});
	});

	it('echo1 "Hello world" should fails', function(done) {
		std.out = '';
		std.err = '';
		shellCommand.run({cmd: 'echo1 "Hello world"'}, function(err) {
			expect(err).ok();
			expect(err).an(Error);
			// messages and codes are slightly different across the OSes
			// e.g. at linux and macos
			expect(err.message).match(
				/Spawned command exits with non-zero code: \d+/
			);
			expect(err.stderr).match(/echo1:.*not found/);
			expect(err.exitCode).to.be.a('number');
			expect(err.exitCode).not.equal(0);
			expect(std.err).equal('');
			expect(std.out).equal('');
			done();
		});
	});
});
