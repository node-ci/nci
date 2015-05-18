'use strict';

var Steppy = require('twostep').Steppy,
	inherits = require('util').inherits,
	ParentReader = require('./base').Reader,
	fs = require('fs'),
	path = require('path'),
	yaml = require('js-yaml');


function Reader() {
	ParentReader.call(this);
}

inherits(Reader, ParentReader);

Reader.prototype.ext = 'yaml';

exports.register = function(app) {
	app.lib.reader.register(Reader.prototype.ext, Reader);
};

Reader.prototype._load = function(dir, name, callback) {
	var self = this;
	Steppy(
		function() {
			var filePath = path.join(dir, name + '.' + self.ext);
			fs.readFile(filePath, 'utf8', this.slot());
		},
		function(err, text) {
			var content = yaml.load(text);

			this.pass(content);
		},
		callback
	);
};
