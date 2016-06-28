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

Scm.prototype._fieldsSeparator = '\u2063' + '\u2063';
Scm.prototype._linesSeparator = '\u2028' + '\u2028';

Scm.prototype._revTemplate = [
	'%h', '%an', '%ad', '%s', '%d'
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
			// git can't clearly clone specified rev but can clone branch
			// possible solution to change clone params to (dst, branch, callback)
			self._run({
				cmd: 'git',
				args: ['clone', '--recursive', self.repository, dst]
			}, this.slot());
			self.cwd = dst;
		},
		function() {
			self._run({cmd: 'git', args: ['checkout', '-f', rev]}, this.slot());
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
			self._run({cmd: 'git', args: ['pull']}, this.slot());
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
			self._run({cmd: 'git', args: [
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
			// get current rev to update on it after git log
			self.getCurrent(this.slot());
		},
		function(err, currentRev) {
			this.pass(currentRev);

			// update to rev2 to prevent git error when switch to branch that
			// doesn't exist locally: "unknown revision or path not in the
			// working tree"
			self.update(rev2, this.slot());
		},
		function(err, currentRev) {
			this.pass(currentRev);

			self._run({cmd: 'git', args: [
				'log', rev1 ? rev1 + '..' + rev2 : rev2,
				'--pretty=' + self._revTemplate + self._linesSeparator
			]}, this.slot());
		},
		function(err, currentRev, stdout) {
			// always skip last line - it's empty
			var rows = stdout.split(self._linesSeparator).slice(0, -1);

			var changes = _(rows).map(function(str) {
				// remove line break which git log add between commits
				return self._parseRev(str.replace(/^\n/, ''));
			});

			this.pass(currentRev, changes);
		},
		function(err, currentRev, changes) {
			this.pass(changes);

			self.update(currentRev.id, this.slot());
		},
		callback
	);
};

Scm.prototype.update = function(rev, callback) {
	var self = this;
	Steppy(
		function() {
			self._run({cmd: 'git', args: ['checkout', '-f', rev]}, this.slot());
		},
		function() {
			self._run({cmd: 'git', args: ['submodule', 'init']}, this.slot());
		},
		function() {
			self._run({cmd: 'git', args: ['submodule', 'update']}, this.slot());
		},
		callback
	);
};
