'use strict';

var EventEmitter = require('events').EventEmitter,
	inherits = require('util').inherits;

function Command(params) {
	params = params || {};
	this.emitIn = params.emitIn;
	this.emitOut = params.emitOut;
	this.emitErr = params.emitErr;
	this.attachStderr = params.attachStderr;
}

exports.Command = Command;

inherits(Command, EventEmitter);

Command.prototype.enableEmitter = function() {
	this.emitOut = true;
	return this;
};

Command.prototype.disableEmitter = function() {
	this.emitOut = false;
	return this;
};
