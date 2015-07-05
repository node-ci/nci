'use strict';

var logger = require('../lib/logger')('resources error handler');

module.exports = function(err, req, res, next) {
	logger.error(
		'Error is occurred during requesting ' +
		req.resource.namespace.name + ' ' + req.action + ':',
		err.stack || err
	);
};
