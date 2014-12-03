'use strict';

exports.createCommand = function(params) {
	var Constructor = require('./' + params.type).Command;
	return new Constructor(params);
};
