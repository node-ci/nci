'use strict';

var expect = require('expect.js'),
	_ = require('underscore'),
	path = require('path'),
	fs = require('fs'),
	createScm = require('../../lib/scm').createScm,
	SpawnCommand = require('../../lib/command/spawn').Command,
	helpers = require('../helpers'),
	gitRevs = require('../helpers').gitRevs;


_(['mercurial', 'git']).each(function(type) {
	describe(type, function() {
		var data = helpers.revs[type],
			originalRepositoryPath = path.resolve(__dirname, '../repos', type),
			repositoryName = 'test-repository',
			repositoryPath = path.join(
				path.resolve(__dirname, '../repos'), repositoryName
			);

		it('remove test repository dir if it exists', function(done) {
			helpers.removeDirIfExists(repositoryPath, done);
		});

		var scm;

		it('create scm instance attached to new repository without errors',
			function() {
				scm = createScm({
					type: type,
					repository: originalRepositoryPath,
					command: new SpawnCommand()
				});
			}
		);

		var currentRev = data[0].id;
		it('clone rev0 to dst without errors', function(done) {
			scm.clone(repositoryPath, data[0].id, done);
		});

		it('expect scm.cwd equals to dst', function() {
			expect(scm.cwd).equal(repositoryPath);
		});

		it('expect current revision equals to rev0', function(done) {
			scm.getCurrent(function(err, rev) {
				if (err) return done(err);
				// there is no tag for mercurial repo coz when you clone with
				// specified revision no later revision will be cloned
				// including those one with add tag (it's after rev 0 in our
				// repo)
				var expectedRev = (
					type === 'mercurial' ? _(data[0]).omit('tags') : data[0]
				);
				expect(rev).eql(expectedRev);
				done();
			});
		});

		it('expect rev0 info is good', function(done) {
			scm.getRev(data[0].id, function(err, rev) {
				if (err) return done(err);
				// no tag here, see note above
				var expectedRev = (
					type === 'mercurial' ? _(data[0]).omit('tags') : data[0]
				);
				expect(rev).eql(expectedRev);
				done();
			});
		});

		// see notes inside git clone method
		var itOrSkip = type === 'git' ? it.skip : it;
		itOrSkip('expect none changes from rev0 to default revision', function(done) {
			scm.getChanges(data[0].id, scm.defaultRev, function(err, changes) {
				if (err) return done(err);
				expect(changes).ok();
				expect(changes).length(0);
				done();
			});
		});

		it('pull to default revision without errors', function(done) {
			scm.pull(scm.defaultRev, done);
		});

		it('now (after pull) expect all after rev 0 as new changes (in reverse ' +
			'order) from rev0 to default revision', function(done) {
			scm.getChanges(data[0].id, scm.defaultRev, function(err, changes) {
				if (err) return done(err);
				expect(changes).ok();
				expect(changes).eql(data.slice(1).reverse());
				done();
			});
		});

		it('expect current revision still equals to rev0', function(done) {
			scm.getCurrent(function(err, rev) {
				if (err) return done(err);
				expect(rev).eql(data[0]);
				done();
			});
		});

		it('update to default revision (should update to last) without error',
			function(done) {
				scm.update(scm.defaultRev, done);
			});

		it('expect current revision equals to last', function(done) {
			scm.getCurrent(function(err, rev) {
				if (err) return done(err);
				expect(rev).eql(data[data.length - 1]);
				done();
			});
		});

		it('create scm instance attached to existing `cwd` without errors',
			function() {
				scm = createScm({
					type: type,
					cwd: repositoryPath,
					command: new SpawnCommand()
				});
			}
		);

		it('expect repository log from rev0 to default revision equals to ' +
			'all revs followed by rev 0 (in reverse order)', function(done) {
			scm.getChanges(data[0].id, scm.defaultRev, function(err, changes) {
				if (err) return done(err);
				expect(changes).ok();
				expect(changes).eql(data.slice(1).reverse());
				done();
			});
		});

		it('remove test repository dir', function(done) {
			helpers.removeDir(repositoryPath, done);
		});
	});
});
