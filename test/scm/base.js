'use strict';

var expect = require('expect.js'),
	scm = require('../../lib/scm');

function MockScm() {}

describe('base scm', function() {
	it('throw error on unknown scm type', function() {
		expect(function() {
			scm.createScm({
				type: 'foobar'
			});
		}).to.throwError(/unknown scm type: foobar/);
	});

	it('throw error without repository or cwd', function() {
		expect(function() {
			scm.createScm({
				type: 'git'
			});
		}).to.throwError(/`repository` or `cwd` must be set/);
	});

	it('throw error without command', function() {
		expect(function() {
			scm.createScm({
				type: 'git',
				repository: 'path',
				cwd: 'path'
			});
		}).to.throwError(/`command` is required/);
	});

	it('register new scm', function() {
		scm.register('mock', MockScm);
	});

	it('create new scm', function() {
		expect(scm.createScm({
			type: 'mock',
			repository: 'path',
			cwd: 'path',
			command: {}
		})).to.be.a(MockScm);
	});
});
