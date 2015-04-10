'use strict';

var _ = require('underscore');

module.exports = function(data) {
	_(['builds', 'projects']).each(function(resource) {
		require('./' + resource)(data);
	});
};
