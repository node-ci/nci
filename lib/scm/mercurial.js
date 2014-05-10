'use strict';

var BaseScm = require('./base'),
	inherits = require('util').inherits;

function MercurialScm(params) {
	BaseScm.call(this, params);
}

module.exports = MercurialScm;

inherits(MercurialScm, BaseScm);

MercurialScm.prototype.defaultRev = 'default';

MercurialScm.prototype.clone = function(dst, rev, callback) {
	var self = this;
	this._exec('hg', ['clone', '--rev', rev, this.repository, dst], function(err) {
		self.cwd = dst;
		callback(err);
	});
};

MercurialScm.prototype.pull = function(rev, callback) {
	this._exec('hg', ['pull', '--rev', rev], callback);
};

MercurialScm.prototype.getId = function(callback) {
	this._exec('hg', ['id', '--id'], function(err, stdout) {
		callback(err, !err && stdout.replace('\n', ''));
	});
};

MercurialScm.prototype.getChanges = function(rev1, rev2, callback) {
	this._exec('hg', [
		'log', '--rev', rev2 + ':' + rev1,
		'--template', '{node|short};;;{author};;;{date|date};;;{desc}\n'
	], function(err, stdout) {
		callback(err, !err &&  stdout.split('\n').slice(0, -2).map(function(str) {
			var parts = str.split(';;;');
			return {
				id: parts[0],
				author: parts[1],
				date: new Date(parts[2]).getTime(),
				comment: parts[3]
			};
		}));
	});
};

MercurialScm.prototype.update = function(rev, callback) {
	this._exec('hg', ['up', rev], callback);
};
