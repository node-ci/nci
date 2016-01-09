'use strict';

var _ = require('underscore'),
	sharedUtils = require('../static/js/shared/utils');

_(exports).extend(sharedUtils);

exports.lpad = function(str, length, chr) {
	chr = chr || '0';
	while (str.length < length) str = chr + str;
	return str;
};

exports.toNumberStr = function(number) {
	return exports.lpad(String(number), 20);
};

exports.toPrettyJson = function(data) {
	return JSON.stringify(data, function(key, value) {
		if (_(value).isRegExp()) {
			return 'RegExp ' + String(value);
		} else {
			return value;
		}
	}, 4);
};
