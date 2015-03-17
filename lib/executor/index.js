'use strict';

exports.createExecutor = function(params) {
	var Constructor = require('./' + params.type).Executor;
	return new Constructor(params);
};
