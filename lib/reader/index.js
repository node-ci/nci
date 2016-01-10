'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	fs = require('fs'),
	path = require('path');


function Reader() {
	this.constructors = {};
}

exports.Reader = Reader;

Reader.prototype.register = function(ext, constructor) {
	this.constructors[ext] = constructor;
};

Reader.prototype.load = function(dir, name, callback) {
	var self = this;

	Steppy(
		function() {
			fs.readdir(dir, this.slot());
		},
		function(err, filePaths) {
			var ext;
			var filePath = _(filePaths).find(function(filePath) {
				ext = path.extname(filePath).replace(/^\./, '');
				return (
					ext in self.constructors &&
					path.basename(filePath, '.' + ext) === name
				);
			});

			if (filePath) {
				var Constructor = self.constructors[ext],
					reader = new Constructor();
				reader.load(dir, name, this.slot());
			} else {
				throw new Error(
					'Can`t load "' + name + '" from "' + dir + '" using ' +
					'readers: ' + _(self.constructors).keys().join(', ')
				);
			}
		},
		callback
	);
};
