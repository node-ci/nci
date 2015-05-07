'use strict';

['Function', 'String', 'Number', 'Date', 'RegExp'].forEach(function(name) {
	exports['is' + name] = function(obj) {
		return toString.call(obj) == '[object ' + name + ']';
	};
});

exports.isObject = function(obj) {
	return obj === Object(obj);
};

exports.noop = function() {};

exports.slice = Array.prototype.slice;

exports.once = function(func) {
	var isCalled = false;
	return function() {
		if (isCalled) return;
		func.apply(this, arguments);
		isCalled = true;
	};
};

exports.prune = function(str, length) {
	var result = '',
		words = str.split(' ');

	do {
		result += words.shift() + ' ';
	} while (words.length && result.length < length);

	return result.replace(/ $/, result.length <= length ? '' : '...');
};
