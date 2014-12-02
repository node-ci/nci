'use strict';

var typesHash = {
	'shell': require('./shell').ShellCommand
};

exports.createCommand = function(params) {
	var Constructor = typesHash[params.type];
	return new Constructor(params);
};
