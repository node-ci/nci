'use strict';

var _ = require('underscore'),
	util = require('util'),
	colors = require('colors/safe');

/*
 * Borrowed from parking lib/node/utils/logger.js, thanks to @artzhuchka
 * TODO: should be separate nmp module
 */
module.exports = function() {
	function F(args) {
		return Logger.apply(this, args);
	}

	F.prototype = Logger.prototype;

	return new F(arguments);
};

module.exports.Logger = Logger;

var methodsHash = {
	log: colors.reset,
	info: colors.cyan,
	warn: colors.yellow,
	error: colors.red
};

function Logger(name, options) {
	this.name = name;
	this.options = _({dateTime: true}).extend(options);
	this._times = {};
}

Logger.prototype._colorizeArgs = function(argsColorFn, args) {
	return argsColorFn.call(colors, util.format.apply(util, args));
};

Logger.prototype._formatArgs = function(argsColorFn, args) {
	var parts = [];

	if (this.options.dateTime) {
		parts.push(colors.gray('[' + new Date().toUTCString() + ']'));
	}

	parts = parts.concat([
		colors.green('[' + this.name + ']'),
		this._colorizeArgs(argsColorFn, args)
	]);

	return parts.join(' ');
};

_(methodsHash).each(function(colorFn, method) {
	Logger.prototype[method] = function() {
		console[method].call(console, this._formatArgs(colorFn, arguments));
	};
});

Logger.prototype.trace = function() {
	var stack = _((new Error()).stack.split('\n')).rest(2).join('\n');
	var msg = 'Trace';
	if (arguments.length) {
		msg += ': ' + util.format.apply(util, arguments);
	}
	msg += '\n' + stack;
	console.log(this._formatArgs(colors.red, [msg]));
};

Logger.prototype.dir = function() {
	this.log(util.inspect.apply(util, arguments));
};

Logger.prototype.time = function() {
	this._times[util.format.apply(util, arguments)] = Date.now();
};

Logger.prototype.timeEnd = function() {
	var label = util.format.apply(util, arguments);
	var time = this._times[label];
	if (!time) return;
	this.log('%s: %dms', label, Date.now() - time);
};