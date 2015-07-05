'use strict';

var _ = require('underscore'),
	errorHandler = require('./errorHandler');

module.exports = function(app) {
	_(['builds', 'projects']).each(function(resource) {
		var resource = require('./' + resource)(app);
		resource.use(errorHandler);
	});
};
