'use strict';

var path = require('path');

exports.createScm = function(config) {
	var Constructor = require(path.join(__dirname, config.type));
	return new Constructor(config);
};
