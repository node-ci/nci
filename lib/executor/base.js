'use strict';

var Steppy = require('twostep').Steppy;

function Executor(params) {
	this.cwd = params.cwd;
}

exports.Executor = Executor;

Executor.prototype._getSources = function(params, callback) {
};

Executor.prototype._runStep = function(params, callback) {

};

Executor.prototype.run = function(params, callback) {
	var self = this;
	Steppy(
		function() {
			self._getSources(params.scm, this.slot());
		},
		function() {
			var funcs = params.steps.map(function(step) {
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