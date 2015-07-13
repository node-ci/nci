'use strict';

var SpawnCommand = require('../lib/command/spawn').Command,
	fs = require('fs'),
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

// revisions for the test mercurial repo
exports.mercurialRevs = [{
	id: 'da2762e71e87',
	tags: ['zero revision'],
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
	tags: ['release 0.1.0', 'second revision'],
	author: 'kotbegemot',
	date: new Date('Sat May 10 03:18:20 2014 +0400').getTime(),
	comment: 'third revision'
}, {
	id: '2ff4bec8b4cc',
	author: 'okv',
	date: new Date('Sun Jun 28 10:54:22 2015 +0300').getTime(),
	comment: 'add tags'
}];

exports.gitRevs = [{
	id: '4ec4643',
	tags: ['zero'],
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
}];

exports.initDb = function(callback) {
	db.init('path/to/db/ignored/for/memdown', {
		db: require('memdown'),
		valueEncoding: 'json'
	}, callback);
	return db;
};
