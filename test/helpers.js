'use strict';

var SpawnCommand = require('../lib/command/spawn').Command,
	fs = require('fs');


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
	author: 'kotbegemot',
	date: new Date('Sat May 10 03:18:20 2014 +0400').getTime(),
	comment: 'third revision'
}];
