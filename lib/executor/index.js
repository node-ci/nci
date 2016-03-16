'use strict';

var BaseExecutor = require('./base').Executor;

exports.BaseExecutor = BaseExecutor;

exports.createExecutor = function(params) {
	var Constructor = require('./' + params.type).Executor;
	return new Constructor(params);
};
