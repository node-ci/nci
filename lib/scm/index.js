'use strict';

var typesHash = {
	'mercurial': require('./mercurial').MercurialScm
};

exports.createScm = function(params) {
	var Constructor = typesHash[params.type];
	return new Constructor(params);
};
