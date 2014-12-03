'use strict';

var EventEmitter = require('events').EventEmitter,
	inherits = require('util').inherits;

function Command(params) {
	params = params || {};
	this.isEmit = params.isEmit;
}

exports.Command = Command;

inherits(Command, EventEmitter);

Command.prototype.enableEmitter = function() {
	this.isEmit = true;
	return this;
};

Command.prototype.disableEmitter = function() {
	this.isEmit = false;
	return this;
};
