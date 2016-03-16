'use strict';

var SpawnCommand = require('./spawn').Command;

exports.SpawnCommand = SpawnCommand;

exports.createCommand = function(params) {
	var Constructor = require('./' + params.type).Command;
	return new Constructor(params);
};
