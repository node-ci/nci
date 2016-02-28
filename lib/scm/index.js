'use strict';

exports.createScm = function(params) {
	var Constructor = require('./' + params.type).Scm;
	return new Constructor(params);
};
