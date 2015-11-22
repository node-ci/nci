'use strict';

var ParentScm = require('./base').Scm,
	inherits = require('util').inherits,
	Steppy = require('twostep').Steppy,
	_ = require('underscore');

function Scm(params) {
	ParentScm.call(this, params);
}

exports.Scm = Scm;

inherits(Scm, ParentScm);

Scm.prototype.defaultRev = 'master';

// use 2 invisible separators as fields separator
Scm.prototype._fieldsSeparator = String.fromCharCode(2063);
Scm.prototype._fieldsSeparator += Scm.prototype._fieldsSeparator;

Scm.prototype._revTemplate = [
	'%h', '%cn', '%cd', '%s', '%d'
].join(Scm.prototype._fieldsSeparator);

Scm.prototype._parseRev = function(str) {
	var parts = str.split(this._fieldsSeparator);

	var rev = {
		id: parts[0],
		author: parts[1],
		date: new Date(parts[2]).getTime(),
		comment: parts[3]
	};

	var refsStr = parts[4];
	if (refsStr) {
		var refs = refsStr
			.replace(/^ *\(/, '')
			.replace(/\) *$/, '')
			.split(', ');

		var tags = _(refs).chain().filter(function(ref) {
			return /^tag: /.test(ref)
		}).map(function(ref) {
			return ref.replace(/^tag: /, '');
		}).value();

		if (tags.length) {
			// sort tags alphabetically
			rev.tags = _(tags).sortBy();
		}
	}

	return rev;
};

Scm.prototype.clone = function(dst, rev, callback) {
	var self = this;
	Steppy(
		function() {
			self.run({
				cmd: 'git',
				args: ['clone', '--recursive', self.repository, dst]
			}, this.slot());
			self.cwd = dst;
		},
		function() {
			self.run({
				cmd: 'git',
				args: ['reset', '--hard', rev]
			}, this.slot());
		},
		callback
	);
};

Scm.prototype.pull = function(rev, callback) {
	var self = this;
	Steppy(
		function() {
			// get current rev to update on it after pull
			self.getCurrent(this.slot());
		},
		function(err, currentRev) {
			this.pass(currentRev);
			self.run({cmd: 'git', args: ['pull']}, this.slot());
		},
		function(err, currentRev) {
			self.update(currentRev.id, this.slot());
		},
		function(err) {
			// ignore "You are not currently on a branch" error
			if (
				err && err.stderr &&
				/You are not currently on a branch/.test(err.stderr)
			) {
				err = null;
			}
			callback(err);
		}
	);
};

Scm.prototype.getRev = function(rev, callback) {
	var self = this;
	Steppy(
		function() {
			self.run({cmd: 'git', args: [
				'show', rev,
				'--pretty=' + self._revTemplate
			]}, this.slot());
		},
		function(err, stdout) {
			var row = stdout.split('\n')[0];

			this.pass(self._parseRev(row));
		},
		callback
	);
};

Scm.prototype.getCurrent = function(callback) {
	var self = this;
	Steppy(
		function() {
			self.getRev('HEAD', this.slot());
		},
		callback
	);
};

Scm.prototype.getChanges = function(rev1, rev2, callback) {
	var self = this;
	Steppy(
		function() {
			self.run({cmd: 'git', args: [
				'log', rev1 ? rev1 + '..' + rev2 : rev2,
				'--pretty=' + self._revTemplate
			]}, this.slot());
		},
		function(err, stdout) {
			// always skip last line - it's empty
			var rows = stdout.split('\n').slice(0, -1);

			var changes = _(rows).map(function(str) {
				return self._parseRev(str);
			});

			this.pass(changes);
		},
		callback
	);
};

Scm.prototype.update = function(rev, callback) {
	this.run({cmd: 'git', args: ['checkout', '-f', rev]}, callback);
};
