'use strict';

var BaseScm = require('./base').Scm;

exports.BaseScm = BaseScm;

var constructors = {
	git: require('./git').Scm,
	mercurial: require('./mercurial').Scm
};

exports.createScm = function(params) {
	if (!constructors[params.type]) {
		throw new Error('unknown scm type: ' + params.type);
	}

	var Constructor = constructors[params.type];
	return new Constructor(params);
};
