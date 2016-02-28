'use strict';

var constructors = {
	local: require('./local').Node
};

exports.register = function(type, constructor) {
	constructor[type] = constructor;
};

exports.createNode = function(params) {
	if (params.type in constructors === false) {
		throw new Error('Unknown node type: ', params.type);
	}

	var Constructor = constructors[params.type];
	return new Constructor(params);
};
