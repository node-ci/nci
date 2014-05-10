'use strict';

var expect = require('expect.js'),
	path = require('path'),
	fs = require('fs'),
	createScm = require('../lib/scm').createScm;


['mercurial'].forEach(function(type) {
	describe(type, function() {
		var data = getTestData(type),
			repositoryName = 'test-repository',
			repositoryPath = path.join(path.join(__dirname, 'repos'), repositoryName);

		it('remove test repository dir if it exists', function(done) {
			if (fs.exists(repositoryPath, function(isExists) {
				if (isExists) {
					scm._exec('rm', ['-R', repositoryPath], done);
				} else {
					done();
				}
			}));
		});

		var scm;

		it('create scm instance attached to new repository without errors', function() {
			scm = createScm({
				type: type,
				repository: path.join(__dirname, 'repos', type)
			});
		});

		var currentRev = data.rev0.id;
		it('clone rev0 to dst without errors', function(done) {
			scm.clone(repositoryPath, data.rev0.id, done);
		});

		it('expect scm.cwd equals to dst', function() {
			expect(scm.cwd).equal(repositoryPath);
		});

		it('expect current id equals to rev0', function(done) {
			scm.getId(function(err, id) {
				if (err) return done(err);
				expect(id).equal(data.rev0.id);
				done();
			});
		});

		it('expect none changes from rev0 to default revision', function(done) {
			scm.getChanges(data.rev0.id, scm.defaultRev, function(err, changes) {
				if (err) return done(err);
				expect(changes).ok();
				expect(changes).length(0);
				done();
			});
		});

		it('pull to default revision without errors', function(done) {
			scm.pull(scm.defaultRev, done);
		});

		it('now (after pull) expect rev1 and rev2 as new changes (in reverse ' +
			'order) from rev0 to default revision', function(done) {
			scm.getChanges(data.rev0.id, scm.defaultRev, function(err, changes) {
				if (err) return done(err);
				expect(changes).ok();
				expect(changes).length(2);
				expect(changes).eql([data.rev2, data.rev1]);
				done();
			});
		});

		it('update to default revision (should update to rev2) without error',
			function(done) {
				scm.update(scm.defaultRev, done);
			});

		it('expect current revision equals to rev2', function(done) {
			scm.getId(function(err, id) {
				if (err) return done(err);
				expect(id).equal(data.rev2.id);
				done();
			});
		});

		it('create scm instance attached to existing `cwd` without errors', function() {
			scm = createScm({type: type, cwd: repositoryPath});
		});

		it('expect repository log from rev0 to default revision equals to ' +
			'rev1 and rev2 (in reverse order)', function(done) {
			scm.getChanges(data.rev0.id, scm.defaultRev, function(err, changes) {
				if (err) return done(err);
				expect(changes).ok();
				expect(changes).length(2);
				expect(changes).eql([data.rev2, data.rev1]);
				done();
			});
		});

		it('remove test repository dir', function(done) {
			scm._exec('rm', ['-R', repositoryPath], done);
		});
	});
});


function getTestData(type) {
	if (type === 'mercurial') return getMercurialData();
}

function getMercurialData() {
	return {
		rev0: {
			id: 'da2762e71e87',
			author: 'kotbegemot',
			date: new Date('Fri May 09 22:36:41 2014 +0400').getTime(),
			comment: 'zero revision'
		},
		rev1: {
			id: '98e3a18d8193',
			author: 'kotbegemot',
			date: new Date('Fri May 09 22:37:19 2014 +0400').getTime(),
			comment: 'first revision'
		},
		rev2: {
			id: '9d7d08445f4c',
			author: 'kotbegemot',
			date: new Date('Sat May 10 03:18:20 2014 +0400').getTime(),
			comment: 'third revision'
		}
	};
}
