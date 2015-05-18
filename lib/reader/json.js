'use strict';

var inherits = require('util').inherits,
	ParentReader = require('./base').Reader,
	path = require('path');


function Reader() {
	ParentReader.call(this);
}

inherits(Reader, ParentReader);

exports.Reader = Reader;

Reader.prototype.ext = 'json';

Reader.prototype._load = function(dir, name, callback) {
	var content = require(path.join(dir, name + '.' + this.ext));
	callback(null, content);
};
