'use strict';

var _ = require('underscore');

exports.prune = function(str, length) {
	var result = '',
		words = str.split(' ');

	do {
		result += words.shift() + ' ';
	} while (words.length && result.length < length);

	return result.replace(/ $/, words.length ? '...' : '');
};

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
