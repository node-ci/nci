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

Scm.prototype._arraysSeparator = '\u2064' + '\u2064';
Scm.prototype._fieldsSeparator = '\u2063' + '\u2063';
Scm.prototype._linesSeparator = '\u2028' + '\u2028';

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
			self._run({
				cmd: 'hg',
				args: ['clone', '--rev', rev, self.repository, dst]
			}, this.slot());
			self.cwd = dst;
		},
		callback
	);
};

Scm.prototype.pull = function(rev, callback) {
	this._run({cmd: 'hg', args: ['pull', '--rev', rev]}, callback);
};

Scm.prototype.getCurrent = function(callback) {
	var self = this;
	Steppy(
		function() {
			self._run({cmd: 'hg', args: [
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
			self._run({cmd: 'hg', args: [
				'log', '--rev', rev2 + ':' + rev1,
				'--template', self._revTemplate + self._linesSeparator
			]}, this.slot());
		},
		function(err, stdout) {
			// always skip last line - it's empty and also skip first
			// rev if we see range
			var rows = stdout.split(self._linesSeparator).slice(
				0, rev1 === rev2 ? -1 : -2
			);

			var changes = _(rows).map(function(str) {
				return self._parseRev(str);
			});

			this.pass(changes);
		},
		callback
	);
};

Scm.prototype.update = function(rev, callback) {
	this._run({cmd: 'hg', args: ['up', '-C', rev]}, callback);
};
