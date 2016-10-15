'use strict';

var expect = require('expect.js'),
	createScm = require('../../lib/scm').createScm;

describe('base scm', function() {
	it('throw error on unknown scm type', function() {
		expect(function() {
			createScm({
				type: 'foobar'
			});
		}).to.throwError(/unknown scm type: foobar/);
	});

	it('throw error without repository or cwd', function() {
		expect(function() {
			createScm({
				type: 'git'
			});
		}).to.throwError(/`repository` or `cwd` must be set/);
	});

	it('throw error without command', function() {
		expect(function() {
			createScm({
				type: 'git',
				repository: 'path',
				cwd: 'path'
			});
		}).to.throwError(/`command` is required/);
	});
});
