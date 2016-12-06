'use strict';

var BaseScm = require('./base').Scm;

exports.BaseScm = BaseScm;
exports.GitScm = require('./git').Scm;
exports.MercurialScm = require('./mercurial').Scm;

var constructors = {
	git: exports.GitScm,
	mercurial: exports.MercurialScm
};

exports.register = function(type, constructor) {
	constructors[type] = constructor;
};

exports.createScm = function(params) {
	if (!constructors[params.type]) {
		throw new Error('unknown scm type: ' + params.type);
	}

	var Constructor = constructors[params.type];
	return new Constructor(params);
};
