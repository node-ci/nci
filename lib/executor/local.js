'use strict';

var Steppy = require('twostep').Steppy,
	inherits = require('util').inherits,
	ParentExecutor = require('./base').Executor,
	createScm = require('../scm').createScm,
	createCommand = require('../command').createCommand,
	fs = require('fs'),
	_ = require('underscore');

function Executor(params) {
	ParentExecutor.call(this, params);
}

inherits(Executor, ParentExecutor);

exports.Executor = Executor;

Executor.prototype._createScm = function(params) {
	return createScm(params);
};

Executor.prototype._getChanges = function(params, callback) {
	var self = this,
		scm, isFirstRun, oldRev;
	Steppy(
		function() {
			var slot = this.slot();
			fs.exists(self.cwd, function(exists) {
				slot(null, exists);
			});
		},
		function(err, exists) {
			var scmParams = {type: params.type};
			if (exists) {
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
				scm.pull(params.rev, this.slot())
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

Executor.prototype.hasScmChanges = function(callback) {
	this._getChanges(this.project.scm, function(err, data) {
		callback(err, !err && data.changes.length > 0);
	});
};

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

Executor.prototype._runStep = function(params, callback) {
	var self = this;
	Steppy(
		function() {
			if (params.type !== 'shell') {
				throw new Error('Unknown step type: ' + params.type);
			}
			// set command cwd to executor cwd
			params.cwd = self.cwd;
			var command = createCommand(
				_({
					emitIn: true,
					emitOut: true,
					emitErr: true,
					attachStderr: true
				}).extend(params)
			);

			command.on('stdin', function(data) {
				self.emit('data', '> ' + String(data));
			});

			command.on('stdout', function(data) {
				self.emit('data', String(data));
			});

			command.on('stderr', function(data) {
				self.emit('data', 'stderr: ' + String(data));
			});

			command.run(params, this.slot())
		},
		callback
	);
};

