'use strict';

var BaseScm = require('./base').Scm;

exports.BaseScm = BaseScm;

var constructors = {
	git: require('./git').Scm,
	mercurial: require('./mercurial').Scm
};

exports.register = function(type, constructor) {
	constructors[type] = constructor;
};

exports.createScm = function(params) {
	if (params.type in constructors === false) {
		throw new Error('Unknown scm type: ' + params.type);
	}

	var Constructor = constructors[params.type];
	return new Constructor(params);
};
