'use strict';

var _ = require('underscore');

module.exports = function(app) {
	_(['builds', 'projects']).each(function(resource) {
		require('./' + resource)(app);
	});
};
