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

Scm.prototype.defaultRev = 'default';

// use 2 invisible separators as fields separator
Scm.prototype._fieldsSeparator = String.fromCharCode(2063);
Scm.prototype._fieldsSeparator += Scm.prototype._fieldsSeparator;

// use 2 vertical tabs as arrays separator
Scm.prototype._arraysSeparator = String.fromCharCode(11);
Scm.prototype._arraysSeparator += Scm.prototype._arraysSeparator;

Scm.prototype._revTemplate = [
	'{node|short}',
	'{author}',
	'{date|date}',
	'{desc}',
	'{join(tags, "' + Scm.prototype._arraysSeparator + '")}'
].join(Scm.prototype._fieldsSeparator);

Scm.prototype._parseRev = function(str) {
	var parts = str.split(this._fieldsSeparator);

	var rev = {
		id: parts[0],
		author: parts[1],
		date: new Date(parts[2]).getTime(),
		comment: parts[3]
	};

	var tagsStr = parts[4];
	if (tagsStr) {
		var tags = tagsStr.split(this._arraysSeparator);
		// drop the tip tag
		tags = _(tags).without('tip');
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
				cmd: 'hg',
				args: ['clone', '--rev', rev, self.repository, dst]
			}, this.slot());
			self.cwd = dst;
		},
		callback
	);
};

Scm.prototype.pull = function(rev, callback) {
	this.run({cmd: 'hg', args: ['pull', '--rev', rev]}, callback);
};

Scm.prototype.getCurrent = function(callback) {
	var self = this;
	Steppy(
		function() {
			self.run({cmd: 'hg', args: [
				'parent', '--template', self._revTemplate
			]}, this.slot());
		},
		function(err, stdout) {
			this.pass(self._parseRev(stdout));
		},
		callback
	);
};

Scm.prototype.getChanges = function(rev1, rev2, callback) {
	var self = this;
	Steppy(
		function() {
			self.run({cmd: 'hg', args: [
				'log', '--rev', rev2 + ':' + rev1,
				'--template', self._revTemplate + '\n'
			]}, this.slot());
		},
		function(err, stdout) {
			// always skip last line - it's empty and also skip first
			// rev if we see range
			var rows = stdout.split('\n').slice(0, rev1 === rev2 ? -1 : -2);

			var changes = _(rows).map(function(str) {
				return self._parseRev(str);
			});

			this.pass(changes);
		},
		callback
	);
};

Scm.prototype.update = function(rev, callback) {
	this.run({cmd: 'hg', args: ['up', rev]}, callback);
};
