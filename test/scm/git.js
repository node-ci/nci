'use strict';

var _ = require('underscore'),
	Steppy = require('twostep').Steppy,
	expect = require('expect.js'),
	fs = require('fs'),
	path = require('path'),
	createScm = require('../../lib/scm').createScm,
	SpawnCommand = require('../../lib/command/spawn').Command;


describe('git specific', function() {
	describe('submodules', function() {
		var cwd = path.resolve(__dirname, '../repos/git-with-submodule');

		var scm = createScm({
			type: 'git',
			cwd: cwd,
			command: new SpawnCommand()
		});

		it('should init and update if present', function(done) {
			Steppy(
				function() {
					scm.update('master', this.slot());
				},
				function() {
					fs.exists(
						path.join(cwd, 'git-submodule/0.txt'),
						_(this.slot()).partial(null)
					);
				},
				function(err, exists) {
					expect(exists).to.be.ok();
					this.pass(null);
				},
				done
			);
		});
	});

	describe('changes', function() {
		var cwd = path.resolve(__dirname, '../repos/git-changes');

		var scm = createScm({
			type: 'git',
			cwd: cwd,
			command: new SpawnCommand()
		});

		var test = function(rev1, rev2, expected, done) {
			Steppy(
				function() {
					scm.getChanges(rev1, rev2, this.slot());
				},
				function(err, changes) {
					expect(changes).to.have.length(expected.length);
					expect(_(changes).pluck('id')).to.eql(expected);
					this.pass(null);
				},
				done
			);
		};

		it('should get all changes without first rev', function(done) {
			test(null, 'master', [
				'1a998dd', '3b058fc', '8b803bd'
			], done);
		});

		it('should get changes in one branch', function(done) {
			test('8b803bd', '1a998dd', [
				'1a998dd', '3b058fc'
			], done);
		});

		it('should get between ancestor branches', function(done) {
			test('8b803bd', 'patch-1', [
				'a70b31e', 'bd18e3e','3b058fc'
			], done);
		});

		it('should return empty between non-ancestor branches', function(done) {
			test('patch-1', 'patch-2', [], done);
		});

		it('should return empty on unknown rev', function(done) {
			test('master', 'foobar', [], done);
		});
	});

});
