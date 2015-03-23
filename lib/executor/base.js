'use strict';

var Steppy = require('twostep').Steppy,
	path = require('path'),
	_ = require('underscore');

function Executor(params) {
	this.project = params.project;
	this.cwd = path.join(this.project.dir, 'workspace');
}

exports.Executor = Executor;

Executor.prototype._getSources = function(params, callback) {
};

Executor.prototype._runStep = function(params, callback) {

};

Executor.prototype.run = function(params, callback) {
	var self = this,
		project = _({}).extend(self.project, params);
	Steppy(
		function() {
			self._getSources(project.scm, this.slot());
		},
		function() {
			var funcs = project.steps.map(function(step) {
				return function() {
					self._runStep(step, this.slot());
				};
			});
			funcs.push(this.slot());
			Steppy.apply(this, funcs);
		},
		callback
	);
};