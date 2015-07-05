'use strict';

module.exports = function(err, req, res, next) {
	console.error(
		'Error is occurred during requesting ' +
		req.resource.namespace.name + ' ' + req.action + ':',
		err.stack || err
	);
};
