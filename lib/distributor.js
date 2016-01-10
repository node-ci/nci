'use strict';

var	Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	Node = require('./node').Node,
	EventEmitter = require('events').EventEmitter,
	inherits = require('util').inherits,
	logger = require('./logger')('distributor');


function Distributor(params) {
	var self = this;
	// nodes to execute builds
	self.nodes = _(params.nodes).map(function(nodeParams) {
		return self._createNode(nodeParams);
	});
	// queued projects to build
	self.queue = [];

	self.saveBuild = params.saveBuild || function(build, callback) {
		callback(null, build);
	};

	self.removeBuild = params.removeBuild || function(build, callback) {
		callback();
	};

	self.projects = params.projects;
	self.notifier = params.notifier;

	self.buildLogLineNumbersHash = {},
	self.lastLinesHash = {};
}

inherits(Distributor, EventEmitter);

exports.Distributor = Distributor;

Distributor.prototype._createNode = function(nodeParams) {
	return new Node(nodeParams);
};

Distributor.prototype._runNext = function(callback) {
	var self = this;

	Steppy(
		function() {
			// update wait reasons for all queue items before run
			self._updateWaitReasons();

			var node;
			var queueItemIndex = _(self.queue).findIndex(function(item) {
				node = _(self.nodes).find(function(node) {
					return node.hasFreeExecutor(item.project);
				});
				return node;
			});

			// quit if we have no suitable project
			if (queueItemIndex === -1) {
				return callback();
			}

			var queueItem = self.queue.splice(queueItemIndex, 1)[0],
				build = queueItem.build;

			self._updateBuild(
				build,
				{startDate: Date.now(), status: 'in-progress', waitReason: ''},
				this.slot()
			);

			var stepCallback = this.slot();
			// run project on the first step two prevent parallel run next calls
			var executor = node.run(build.project, build.params, function(err) {
				self._updateBuild(
					build,
					{
						endDate: Date.now(),
						status: err ? 'error' : 'done',
						completed: true,
						error: err ? {
							message: err.message, stderr: err.stderr
						} : null
					},
					function(err, build) {
						if (err) {
							logger.error(
								'Error during build update: ', err.stack || err
							);
							return stepCallback(err);
						}
						self._onBuildComplete(build, stepCallback);
					}
				);
			});

			executor.on('currentStep', function(stepName) {
				self._updateBuild(build, {currentStep: stepName});
			});

			executor.on('stepTimingsChange', function(stepTimings) {
				self._updateBuild(build, {stepTimings: stepTimings});
			});

			executor.on('data', function(data) {
				self._onBuildData(build, data);
			});

			executor.once('scmData', function(scmData) {
				self._updateBuild(build, {scm: scmData});
				// run the same project again if we don't reach the latest rev
				if (!scmData.isLatest) {
					self.run({
						projectName: build.project.name,
						initiator: {
							type: 'build',
							id: build.id,
							number: build.number,
							project: {name: build.project.name}
						}
					});
				}
			});

			// update wait reasons for all queue items after run
			self._updateWaitReasons();
		},
		callback
	);
};

Distributor.prototype._onBuildData = function(build, data) {
	var self = this;

	self.emit('buildData', build, data);

	var cleanupText = function(text) {
		return text.replace('\r', '');
	};

	var splittedData  = data.split('\n'),
		logLineNumber = self.buildLogLineNumbersHash[build.id] || 0;

	self.lastLinesHash[build.id] = self.lastLinesHash[build.id] || '';

	// if we don't have last line, so we start new line
	if (!self.lastLinesHash[build.id]) {
		logLineNumber++;
	}
	self.lastLinesHash[build.id] += _(splittedData).first();

	var lines = [{
		text: cleanupText(self.lastLinesHash[build.id]),
		buildId: build.id,
		number: logLineNumber
	}];

	if (splittedData.length > 1) {
		// if we have last '' we have to take all except last
		// this shown that string ends with eol
		if (_(splittedData).last() === '') {
			self.lastLinesHash[build.id] = '';
			splittedData = _(splittedData.slice(1)).initial();
		} else {
			self.lastLinesHash[build.id] = _(splittedData).last();
			splittedData = _(splittedData).tail();
		}

		lines = lines.concat(_(splittedData).map(function(line) {
			return {
				text: cleanupText(line),
				buildId: build.id,
				number: ++logLineNumber
			};
		}));
	}

	self.buildLogLineNumbersHash[build.id] = logLineNumber;

	self.emit('buildLogLines', build, lines);
};

Distributor.prototype._updateWaitReasons = function() {
	var self = this;
	_(self.queue).each(function(item) {
		var waitReasons = _(self.nodes).map(function(node) {
			return node.getExecutorWaitReason(item.project);
		});

		var waitReason = _(waitReasons).compact().join(', ');
		// set only non-empty reasons
		if (waitReason && waitReason !== item.build.waitReason) {
			self._updateBuild(item.build, {waitReason: waitReason});
		}
	});
};

Distributor.prototype._onBuildComplete = function(build, callback) {
	var self = this;

	Steppy(
		function() {
			// notify about build
			self.notifier.send(build);

			// process after build triggers
			var triggerAfterGroup = this.makeGroup();

			var after = build.project.trigger && build.project.trigger.after;
			if (after) {
				_(after).each(function(item) {
					if (!item.status || item.status === build.status) {
						self.run({
							projectName: item.project,
							initiator: {
								type: 'build',
								id: build.id,
								number: build.number,
								project: {name: build.project.name}
							}
						}, triggerAfterGroup.slot());
					}
				});
			}

		},
		function(err, triggerAfterGroupResults) {
			// try to run next project from the queue
			self._runNext(this.slot());
		},
		callback
	);
};

Distributor.prototype._updateBuild = function(build, changes, callback) {
	var self = this;
	callback = callback || _.noop;
	var isWithId = Boolean(build.id),
		isWithNumber = Boolean(build.number);

	Steppy(
		function() {
			if (build.id && changes.status && changes.status !== build.status) {
				logger.log(
					'Build #%s (project "%s") change status: %s -> %s',
					build.id,
					build.project.name,
					build.status,
					changes.status
				);
			}

			_(build).extend(changes);

			// skip saving to db of unimportant data
			if (changes.currentStep && _(changes).keys().length === 1) {
				this.pass(null);
			} else {
				self.saveBuild(build, this.slot());
			}
		},
		function() {
			if (!isWithId && build.id) {
				logger.log(
					'Build #%s (project "%s") %s',
					build.id,
					build.project.name,
					build.status
				);
			}

			// if number appear after save to db then add it to changes
			// TODO: might be better to generate number right there (instead
			// of hooks)
			if (!isWithNumber && build.number) {
				changes.number = build.number;
			}

			// emits only after get an id (at save build)
			self.emit('buildUpdate', build, changes);

			this.pass(build);
		},
		callback
	);
};

Distributor.prototype.cancel = function(id, callback) {
	callback = callback || function(err) {
		if (err) logger.error('Error during cancel: ', err.stack || err);
	};
	var self = this;

	Steppy(
		function() {
			var queueItemIndex = _(self.queue).findIndex(function(item) {
				return item.build.id === id;
			});

			if (queueItemIndex === -1) {
				throw new Error(
					'Build with id "' + id + '" not found for cancel'
				);
			}

			// only queued build are in the queue, so there is no reason
			// to check status
			var build = self.queue[queueItemIndex].build;

			// remove from queue
			self.queue.splice(queueItemIndex, 1)[0];

			// remove from db
			self.removeBuild(build, this.slot());

			self.emit('buildCancel', build);
		},
		callback
	);
};

Distributor.prototype.run = function(params, callback) {
	callback = callback || function(err) {
		if (err) logger.error('Error during run: ', err.stack || err);
	};
	var self = this,
		project;

	Steppy(
		function() {
			project = _(self.projects.get(params.projectName)).clone();

			if (params.withScmChangesOnly) {
				self.nodes[0].hasScmChanges(project, this.slot());
			} else {
				this.pass(null);
			}
		},
		function(err, hasScmChanges) {
			if (params.withScmChangesOnly && !hasScmChanges) {
				logger.log(
					'Building of "%s" skipped coz no scm changes',
					project.name
				);
				return callback();
			}

			if (!params.queueQueued) {
				var queuedItem = _(self.queue).find(function(item) {
					return item.project.name === project.name;
				});
				if (queuedItem) {
					logger.log(
						'Building of "%s" skipped coz it`s already queued',
						project.name
					);
					return callback();
				}
			}

			self._updateBuild({}, {
				project: project,
				initiator: params.initiator,
				params: params.params,
				createDate: Date.now(),
				status: 'queued',
				completed: false
			}, this.slot());
		},
		function(err, build) {
			self.queue.push({project: project, build: build});
			self._runNext(this.slot());
		},
		callback
	);
};
