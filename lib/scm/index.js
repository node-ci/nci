'use strict';

var path = require('path');

var typesHash = {
	'mercurial': require('./mercurial').MercurialScm
};

exports.createScm = function(config) {
	var Constructor = typesHash[config.type];
	return new Constructor(config);
};
