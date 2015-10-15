'use strict';

(function(root, factory) {

	if (typeof module !== 'undefined' && module.exports) {
		// CommonJS
		module.exports = factory();
	} else if (typeof define === 'function' && define.amd) {
		// AMD
		define(function() {
			return factory();
		});
	}

}(this, function() {

	var utils = {};

	utils.prune = function(str, length) {
		var result = '',
			words = str.split(' ');

		do {
			result += words.shift() + ' ';
		} while (words.length && result.length < length);

		return result.replace(/ $/, words.length ? '...' : '');
	};

	return utils;

}));
