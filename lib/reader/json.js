'use strict';

var Steppy = require('twostep').Steppy,
	inherits = require('util').inherits,
	ParentReader = require('./base').Reader,
	path = require('path'),
	fs = require('fs');


function Reader() {
	ParentReader.call(this);
}

inherits(Reader, ParentReader);

exports.Reader = Reader;

Reader.prototype.ext = 'json';

Reader.prototype._load = function(dir, name, callback) {
	var self = this;
	Steppy(
		function() {
			fs.readFile(path.join(dir, name + '.' + self.ext), 'utf8', this.slot())
		},
		function(err, content) {
			this.pass(JSON.parse(content));
		},
		callback
	);
};
