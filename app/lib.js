'use strict';

var libLogger = require('../lib/logger'),
	libReader = require('../lib/reader'),
	libNotifier = require('../lib/notifier'),
	libCommand = require('../lib/command'),
	libExecutor = require('../lib/executor'),
	libScm = require('../lib/scm'),
	libNode = require('../lib/node');

module.exports = function(params, callback) {
	var lib = {};
	lib.logger = libLogger;
	lib.reader = libReader;
	lib.notifier = libNotifier;
	lib.command = libCommand;
	lib.executor = libExecutor;
	lib.scm = libScm;
	lib.node = libNode;

	callback(null, lib);
};
