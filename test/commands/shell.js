'use strict';

var expect = require('expect.js'),
	ShellCommand = require('../../lib/command/shell').Command;

describe('Shell command', function() {

	var shellCommand;
	it('Should be created without errors', function() {
		shellCommand = new ShellCommand({
			isEmit: true
		});
	});

	it('Default shell should be sh', function() {
		expect(shellCommand.shell).equal('/bin/sh');
	});

	it('echo "Hello world" should be done', function(done) {
		var stdout = '';
		shellCommand.on('stdout', function(data) {
			stdout += data;
		});
		shellCommand.run({cmd: 'echo "Hello world"'}, function(err) {
			expect(err).not.ok();
			expect(stdout).equal('Hello world\n');
			done();
		});
	});

});
