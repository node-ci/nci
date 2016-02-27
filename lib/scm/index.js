'use strict';

var SpawnCommand = require('../command/spawn').Command;

exports.createScm = function(params) {
	var Constructor = require('./' + params.type).Scm;

	params.command = params.command  || new SpawnCommand();

	return new Constructor(params);
};
