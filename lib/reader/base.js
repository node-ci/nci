'use strict';

var Steppy = require('twostep').Steppy;

function Reader() {
}

exports.Reader = Reader;

Reader.prototype.load = function(dir, name, callback) {
	var self = this;
	Steppy(
		function() {
			self._load(dir, name, this.slot());
		},
		function(err, content) {
			if (err) {
				err.message = 'Error while loading "' + name + '" from "' + dir +
				'": \n' + err.message;
			}
			callback(err, content);
		}
	);
};

Reader.prototype._load = function(dir, name, callback) {
};
