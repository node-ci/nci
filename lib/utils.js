'use strict';

var _ = require('underscore'),
	sharedUtils = require('../app/utils');

_(exports).extend(sharedUtils);

exports.lpad = function(str, length, chr) {
	chr = chr || '0';
	while (str.length < length) str = chr + str;
	return str;
};

exports.toNumberStr = function(number) {
	return exports.lpad(String(number), 20);
};
