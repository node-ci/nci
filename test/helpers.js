'use strict';

var SpawnCommand = require('../lib/command/spawn').Command,
	fs = require('fs'),
	path = require('path'),
	db = require('../db');


exports.removeDir = function(dir, callback) {
	new SpawnCommand().run({cmd: 'rm', args: ['-R', dir]}, callback);
};

exports.removeDirIfExists = function(dir, done) {
	if (fs.exists(dir, function(isExists) {
		if (isExists) {
			exports.removeDir(dir, done);
		} else {
			done();
		}
	}));
};

exports.revs = {};

// revisions for the test mercurial repo
exports.revs.mercurial = [{
	id: 'da2762e71e87',
	tags: ['zero-revision'],
	author: 'kotbegemot',
	date: new Date('Fri May 09 22:36:41 2014 +0400').getTime(),
	comment: 'zero revision'
}, {
	id: '98e3a18d8193',
	author: 'kotbegemot',
	date: new Date('Fri May 09 22:37:19 2014 +0400').getTime(),
	comment: 'first revision'
}, {
	id: '9d7d08445f4c',
	tags: ['release-0.1.0', 'second-revision'],
	author: 'kotbegemot',
	date: new Date('Sat May 10 03:18:20 2014 +0400').getTime(),
	comment: 'third revision'
}, {
	id: '4593f737280d',
	author: 'okv',
	date: new Date('Sun Jun 28 10:54:22 2015 +0300').getTime(),
	comment: 'add tags'
}];

exports.revs.git = [{
	id: '4ec4643',
	tags: ['zero-revision'],
	author: 'oleg',
	date: new Date('Mon Jul 13 22:30:58 2015 +0300').getTime(),
	comment: 'zero revision'
}, {
	id: 'f76bae6',
	author: 'oleg',
	date: new Date('Mon Jul 13 22:31:58 2015 +0300').getTime(),
	comment: 'first revision'
}, {
	id: '39245d9',
	tags: ['release-0.1.0', 'second-revision'],
	author: 'oleg',
	date: new Date('Mon Jul 13 22:32:59 2015 +0300').getTime(),
	comment: 'third revision'
}, {
	id: '9577350',
	author: 'oleg',
	date: new Date('Thu Jul 16 22:07:40 2015 +0300').getTime(),
	comment: '4th commit'
}];

exports.scm = {};

exports.scm.mercurial = {
	type: 'mercurial',
	repository: path.join(__dirname, 'repos', 'mercurial'),
	rev: 'default'
};

exports.scm.git = {
	type: 'git',
	repository: path.join(__dirname, 'repos', 'git'),
	rev: 'master'
};

exports.repository = {
	scm: exports.scm.git,
	revs: exports.revs.git
};

exports.initDb = function(callback) {
	db.init('path/to/db/ignored/for/memdown', {
		db: require('memdown'),
		valueEncoding: 'json'
	}, callback);
	return db;
};
