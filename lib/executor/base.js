'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	EventEmitter = require('events').EventEmitter,
	inherits = require('util').inherits;

function Executor(params) {
	this.project = params.project;
}

exports.Executor = Executor;

inherits(Executor, EventEmitter);

Executor.prototype.throttledEmit = _(function() {
	this.emit.apply(this, arguments);
}).throttle(500);

Executor.prototype._getSources = function(params, callback) {
	var self = this,
		scm;
	Steppy(
		function() {
			self._getChanges(params, this.slot());
		},
		function(err, data) {
			scm = data.scm;
			this.pass(data.changes);
			scm.update(data.rev, this.slot());
		},
		function(err, changes) {
			scm.getCurrent(this.slot());
			this.pass(changes);
			scm.getRev(params.rev, this.slot());
		},
		function(err, currentRev, changes, latestRev) {
			this.pass({
				rev: currentRev,
				changes: changes,
				isLatest: currentRev.id === latestRev.id
			});
		},
		callback
	);
};

Executor.prototype._listenCommand = function(command) {
	var self = this;

	command.on('stdin', function(data) {
		self.emit('data', '> ' + String(data));
	});

	command.on('stdout', function(data) {
		self.emit('data', String(data));
	});

	command.on('stderr', function(data) {
		self.emit('data', 'stderr: ' + String(data));
	});

	return command;
};

Executor.prototype._runStep = function(step, callback) {
	var self = this,
		params = _(step).clone();

	Steppy(
		function() {
			if (params.type !== 'shell') {
				throw new Error('Unknown step type: ' + params.type);
			}
			// set command cwd to executor cwd
			params.cwd = self.cwd;
			var command = self._createCommand(
				_({
					emitIn: true,
					emitOut: true,
					emitErr: true,
					attachStderr: true
				}).extend(params)
			);

			self._listenCommand(command);

			// TODO: should be fixed properly, currently it's quick fix for
			// NODE_ENV which affects npm install/prune calls
			params.options = params.options || {};
			params.options.env = params.options.env || process.env;
			delete params.options.env.NODE_ENV;

			command.run(params, this.slot());
		},
		callback
	);
};

Executor.prototype._getChanges = function(params, callback) {
	var self = this,
		scm, isFirstRun, oldRev;
	Steppy(
		function() {
			self._isCloned(this.slot());
		},
		function(err, cloned) {
			var scmParams = {type: params.type};
			if (cloned) {
				scmParams.cwd = self.cwd;
				isFirstRun = false;
			} else {
				scmParams.repository = params.repository;
				isFirstRun = true;
			}
			scm = self._createScm(scmParams);

			scm.on('stdin', function(data) {
				self.emit('data', '> ' + String(data));
			});

			if (isFirstRun) {
				this.pass(null);
			} else {
				scm.getCurrent(this.slot());
			}
		},
		function(err, id) {
			oldRev = id;

			if (isFirstRun) {
				scm.clone(self.cwd, params.rev, this.slot());
			} else {
				scm.pull(params.rev, this.slot());
			}
		},
		function() {
			scm.getChanges(oldRev && oldRev.id, params.rev, this.slot());
		},
		function(err, changes) {
			var target = self._getTarget(params.rev, changes);
			this.pass({
				scm: scm,
				oldRev: oldRev,
				rev: target.rev,
				changes: target.changes
			});
		},
		callback
	);
};

// Does current project scm has new changes to build
Executor.prototype.hasScmChanges = function(callback) {
	this._getChanges(this.project.scm, function(err, data) {
		callback(err, !err && data.changes.length > 0);
	});
};

Executor.prototype._beforeRun = function(params, callback) {
	callback();
};

Executor.prototype._afterRun = function(params, callback) {
	callback();
};

Executor.prototype._onRunError = function(originalErr, callback) {
	callback(originalErr);
};

Executor.prototype.run = function(params, callback) {
	var self = this,
		project = self.project,
		beforeRunTiming = {name: 'prepare executor'},
		getSourcesTiming = {name: 'get sources'},
		afterRunTiming = {name: 'cleanup executor'},
		stepTimings = [];

	Steppy(
		function() {
			self.throttledEmit('currentStep', beforeRunTiming.name);
			var beforeRunStart = Date.now();
			this.pass(beforeRunStart);
			self._beforeRun(params, this.slot());
		},
		function(err, beforeRunStart) {
			beforeRunTiming.duration = Date.now() - beforeRunStart;
			stepTimings.push(beforeRunTiming);

			self.throttledEmit('currentStep', getSourcesTiming.name);
			var getSourcesStart = Date.now();
			this.pass(getSourcesStart);
			self._getSources(project.scm, this.slot());
		},
		function(err, getSourcesStart, scmData) {
			getSourcesTiming.duration = Date.now() - getSourcesStart;
			stepTimings.push(getSourcesTiming);

			self.emit('scmData', scmData);

			var funcs = project.steps.map(function(step, index) {
				return function() {
					var start = Date.now(),
						stepCallback = this.slot();

					self.throttledEmit('currentStep', step.name);

					var timing = {name: step.name};
					self._runStep(step, function(err) {
						timing.duration = Date.now() - start;
						stepTimings.push(timing);
						self.emit('stepTimingsChange', stepTimings);
						stepCallback(err);
					});
				};
			});

			funcs.push(this.slot());
			Steppy.apply(this, funcs);
		},
		function() {
			self.throttledEmit('currentStep', afterRunTiming.name);
			var afterRunStart = Date.now();
			this.pass(afterRunStart);

			self._afterRun(params, this.slot());
		},
		function(err, afterRunStart) {
			if (err) {
				self._onRunError(err, callback);
			} else {
				afterRunTiming.duration = Date.now() - afterRunStart;
				stepTimings.push(afterRunTiming);
				self.emit('stepTimingsChange', stepTimings);

				callback();
			}
		}
	);
};

// Returns target rev and filtered changes according to `catchRev`
Executor.prototype._getTarget = function(rev, changes) {
	var result = {rev: rev, changes: changes},
		catchRev = this.project.catchRev;

	if (catchRev) {
		// reverse before search
		changes = changes.reverse();

		var index;

		var comment = catchRev.comment;
		if (comment) {
			index = _(changes).findIndex(function(change) {
				if (_(comment).isRegExp()) {
					return comment.test(change.comment);
				} else {
					return comment === change.comment;
				}
			});
		}

		var tag = catchRev.tag;
		if (tag) {
			index = _(changes).findIndex(function(change) {
				if (change.tags) {
					if (_(tag).isRegExp()) {
						return _(change.tags).find(function(changeTag) {
							return tag.test(changeTag);
						});
					} else {
						return _(change.tags).contains(tag);
					}
				}
			});
		}

		if (index !== -1) {
			result.rev = changes[index].id;
			result.changes = changes.slice(0, index + 1);
			result.changes.reverse();
		}

		// reverse back before return
		changes = changes.reverse();
	}

	return result;
};
