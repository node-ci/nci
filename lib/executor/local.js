'use strict';

var Steppy = require('twostep').Steppy,
	inherits = require('util').inherits,
	ParentExecutor = require('./base').Executor,
	createScm = require('../scm').createScm,
	createCommand = require('../command').createCommand,
	fs = require('fs'),
	path = require('path'),
	SpawnCommand = require('../command/spawn').Command;

function Executor(params) {
	ParentExecutor.call(this, params);
	this.cwd = path.join(this.project.dir, 'workspace');
}

inherits(Executor, ParentExecutor);

exports.Executor = Executor;

Executor.prototype._createScm = function(params) {
	params.command = new SpawnCommand();

	return createScm(params);
};

Executor.prototype._createCommand = function(params) {
	return createCommand(params);
};

Executor.prototype._isCloned = function(callback) {
	fs.exists(this.cwd, function(exists) {
		callback(null, exists);
	});
};
