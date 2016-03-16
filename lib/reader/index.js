'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	fs = require('fs'),
	path = require('path'),
	BaseReaderLoader = require('./loader/base').Loader,
	JsonReaderLoader = require('./loader/json').Loader;

var constructors = {
	json: JsonReaderLoader
};

exports.BaseReaderLoader = BaseReaderLoader;

exports.register = function(ext, constructor) {
	constructors[ext] = constructor;
};

function Reader() {
}

exports.Reader = Reader;

Reader.prototype.load = function(dir, name, callback) {
	Steppy(
		function() {
			fs.readdir(dir, this.slot());
		},
		function(err, filePaths) {
			var ext;
			var filePath = _(filePaths).find(function(filePath) {
				ext = path.extname(filePath).replace(/^\./, '');
				return (
					ext in constructors &&
					path.basename(filePath, '.' + ext) === name
				);
			});

			if (filePath) {
				var Constructor = constructors[ext],
					reader = new Constructor();
				reader.load(dir, name, this.slot());
			} else {
				throw new Error(
					'Can`t load "' + name + '" from "' + dir + '" using ' +
					'readers: ' + _(constructors).keys().join(', ')
				);
			}
		},
		callback
	);
};
