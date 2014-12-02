'use strict';

var createScm = require('../lib/scm').createScm,
	createCommnd = require('../lib/command').createCommnd;

function Build(params) {
	this.config = params.config;
	this.cwd = params.cwd;
}

exports.Build = Build;

Build.prototype.run = function(state, callback) {
	var self = this;
	state.step = state.step || 'getSources';
	this[state.step](state, function(err) {
		if (err) {
			state.err = err;
			self.onFailure(state, callback);
			return;
		}
		if (state.step === 'getSources') {
			state.step = 'steps';
			state.stepIndex = 0;
		} else if (state.step === 'steps') {
			if (state.stepIndex + 1 < self.config.steps.length) {
				state.stepIndex++;
			} else {
				delete state.stepIndex;
			}
		}
	});
};

Build.prototype.getSources = function(state, callback) {

};

Build.prototype.steps = function(state, callback) {
	var cmdParams = this.config.steps[state.stepIndex];
	var cmd = createCommand({type: cmdParams.type});
	cmd.run(cmdParams, callback);
};
