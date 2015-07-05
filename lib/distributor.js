'use strict';

var	Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	Node = require('./node').Node,
	EventEmitter = require('events').EventEmitter,
	inherits = require('util').inherits,
	notifier = require('./notifier'),
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

	self.projects = params.projects;
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
			if (queueItemIndex) {
				return callback();
			}

			this.pass(node);

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

			executor.on('data', function(data) {
				self.emit('buildData', build, data);
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
						},
					});
				}
			});

			// update wait reasons for all queue items after run
			self._updateWaitReasons();
		},
		callback
	);
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
			notifier.send(build);

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
							},
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
	var isWithNumber = Boolean(build.number);

	Steppy(
		function() {
			_(build).extend(changes);

			// skip saving to db of unimportant data
			if (changes.currentStep && _(changes).keys().length === 1) {
				this.pass(null);
			} else {
				self.saveBuild(build, this.slot());
			}
		},
		function() {

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

Distributor.prototype.run = function(params, callback) {
	var self = this,
		project;
	callback = callback || function(err) {
		if (err) {
			logger.error('Error during run: ', err.stack || err);
		}
	};
	Steppy(
		function() {
			project = _(self.projects).findWhere({name: params.projectName});
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
