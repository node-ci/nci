'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
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

Executor.prototype.setParams = function(params) {
	ParentExecutor.prototype.setParams.call(this, params);

	this.envVars = this.envVars || {};
	// add all env vars of nci server to command
	_(this.envVars).extend(process.env);
	// exclude NODE_ENV coz it passed for nci server affects npm install/prune
	// calls during build
	delete this.envVars.NODE_ENV;
};

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
