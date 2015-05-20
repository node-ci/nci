'use strict';

exports.prune = function(str, length) {
	var result = '',
		words = str.split(' ');

	do {
		result += words.shift() + ' ';
	} while (words.length && result.length < length);

	return result.replace(/ $/, words.length ? '...' : '');
};
