'use strict';

var Steppy = require('twostep').Steppy,
	path = require('path'),
	_ = require('underscore'),
	EventEmitter = require('events').EventEmitter,
	inherits = require('util').inherits,
	utils = require('../utils');

function Executor(params) {
	this.project = params.project;
	this.cwd = path.join(this.project.dir, 'workspace');
}

exports.Executor = Executor;

inherits(Executor, EventEmitter);

Executor.prototype._getSources = function(params, callback) {
};

Executor.prototype._runStep = function(params, callback) {

};

Executor.prototype.run = function(params, callback) {
	var self = this,
		project = _({}).extend(self.project, params);
	Steppy(
		function() {
			self.emit('currentStep', 'get sources');
			self._getSources(project.scm, this.slot());
		},
		function(err, scmData) {
			self.emit('scmData', scmData);
			var funcs = project.steps.map(function(step, index) {
				return function() {
					var stepLabel = step.name || utils.prune(step.cmd, 15);
					self.emit('currentStep', stepLabel);
					self._runStep(step, this.slot());
				};
			});
			funcs.push(this.slot());
			Steppy.apply(this, funcs);
		},
		callback
	);
};