'use strict';

var EventEmitter = require('events').EventEmitter,
	inherits = require('util').inherits;

function Command(params) {
	this.setParams(params);
}

exports.Command = Command;

inherits(Command, EventEmitter);
