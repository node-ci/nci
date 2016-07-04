'use strict';

var Steppy = require('twostep').Steppy,
	inherits = require('util').inherits,
	ParentLoader = require('./base').Loader,
	path = require('path'),
	fs = require('fs');


function Loader() {
	ParentLoader.call(this);
}

inherits(Loader, ParentLoader);

exports.Loader = Loader;

Loader.prototype.ext = 'json';

Loader.prototype._load = function(dir, name, callback) {
	var self = this;
	Steppy(
		function() {
			fs.readFile(path.join(dir, name + '.' + self.ext), 'utf8', this.slot());
		},
		function(err, content) {
			this.pass(JSON.parse(content));
		},
		callback
	);
};
