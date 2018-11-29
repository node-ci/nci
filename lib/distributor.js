'use strict';

var	Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	createNode = require('./node').createNode,
	EventEmitter = require('events').EventEmitter,
	inherits = require('util').inherits,
	logger = require('./logger')('distributor');


function Distributor(params) {
	this.nodes = params.nodes;

	// queued projects to build
	this.queue = [];

	this.saveBuild = params.saveBuild || function(build, callback) {
		callback(null, build);
	};

	this.removeBuild = params.removeBuild || function(build, callback) {
		callback();
	};

	this.projects = params.projects;
	this.notifier = params.notifier;

	this.buildLogLineNumbersHash = {};
	this.lastLinesHash = {};

	this.inprogressBuildsHash = {};
}

inherits(Distributor, EventEmitter);

exports.Distributor = Distributor;

// do deferred initialization (e.g. create nodes after all plugins load)
Distributor.prototype.init = function() {
	var self = this,
		namesHash = {};

	self.nodes = _(self.nodes).map(function(nodeParams) {
		if (!nodeParams.name) {
			nodeParams.name = nodeParams.type;
		}

		if (namesHash[nodeParams.name]) {
			throw new Error('Node name `' + nodeParams.name + '` already used');
		}
		namesHash[nodeParams.name] = 1;

		return self._createNode(nodeParams);
	});
};

Distributor.prototype._createNode = function(params) {
	return createNode(params);
};

Distributor.prototype._getBlockerExecutor = function(getBlockers, getTarget) {
	var blockerExecutor;

	_(this.nodes).find(function(node) {
		blockerExecutor = _(node.executors).find(function(executor) {
			var target = getTarget(executor);
			return _(getBlockers(executor)).find(function(blocker) {
				if (_(blocker).isRegExp()) {
					return blocker.test(target);
				} else {
					return blocker === target;
				}
			});
		});

		return blockerExecutor;
	});

	return blockerExecutor;
};

// get wait reason for `project` with `params` when try to run it on `node`
Distributor.prototype._getExecutorWaitReason = function(node, project, params) {

	// get node level wait reason
	var waitReason = node.getExecutorWaitReason(project, params);

	if (!waitReason) {
		// get wait reason across all nodes
		var blockerExecutor;

		if (project.blockedBy) {
			blockerExecutor = this._getBlockerExecutor(
				function(executor) {
					return project.blockedBy;
				},
				function(executor) {
					return executor.project.name;
				}
			);
		}

		if (!blockerExecutor) {
			blockerExecutor = this._getBlockerExecutor(
				function(executor) {
					return executor.project.blocks;
				},
				function(executor) {
					return project.name;
				}
			);
		}

		if (blockerExecutor) {
			waitReason = (
				'blocked by currently running "' +
				blockerExecutor.project.name + '"'
			);
		}
	}

	return waitReason;
};

Distributor.prototype._getNodeForScmChangesCheck = function(project, params) {
	return _(this.nodes).find(function(node) {
		return !node.getExecutorWaitReason(
			project,
			_({checkForScmChangesOnly: true}).defaults(params)
		);
	});
};

Distributor.prototype._runNext = function(callback) {
	var self = this,
		node,
		executorId;

	Steppy(
		function() {
			// update wait reasons for all queue items before run
			self._updateWaitReasons();

			var queueItemIndex = _(self.queue).findIndex(function(item) {
				node = _(self.nodes).find(function(node) {
					return !self._getExecutorWaitReason(
						node,
						item.project,
						{env: item.build.env}
					);
				});
				return node;
			});

			// quit if we have no suitable project
			if (queueItemIndex === -1) {
				return callback();
			}

			var queueItem = self.queue.splice(queueItemIndex, 1)[0],
				build = queueItem.build;

			// all main params (that can affect wait reason) must be passes to
			// reserve
			executorId = node.reserveExecutor(
				build.project,
				{env: build.env}
			);

			self._updateBuild(
				build,
				{
					startDate: Date.now(),
					status: 'in-progress',
					waitReason: '',
					node: _(node).pick('type', 'name')
				},
				this.slot()
			);
		},
		function(err, build) {
			this.pass(build);

			// add some extra params to executor, some envVars
			// that available only after build update(build number),
			// also add env vars specified for the project
			var executorParams = {
				envVars: _({
					NCI_BUILD_ID: String(build.id),
					NCI_BUILD_NUMBER: String(build.number),
					NCI_PROJECT_NAME: build.project.name,
					NCI_NODE_NAME: build.node.name,
					NCI_ENV_NAME: build.env ? build.env.name : ''
				}).defaults(build.project.envVars)
			};

			var stepCallback = this.slot();

			var executor = node.runExecutor(executorId, executorParams, function(err) {
				if (err && !err.projectStepError) {
					logger.error(
						'Error during project execution: ', err.stack || err
					);
				}

				var changes = {
					endDate: Date.now(),
					completed: true
				};

				// executor may not exist on error
				if (executor && executor.canceled) {
					changes.status = 'canceled';
					changes.canceledBy = self.inprogressBuildsHash[build.id].canceledBy;
				} else if (err) {
					changes.status = 'error';
					changes.error = _(err).pick('message', 'stderr');
				} else {
					changes.status = 'done';
				}

				self._updateBuild(
					build,
					changes,
					function(err, build) {
						delete self.inprogressBuildsHash[build.id];

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

			// executor may not exist on error
			if (executor) {
				self.inprogressBuildsHash[build.id] = {
					build: build,
					executor: executor
				};

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
			}

			// update wait reasons for all queue items after run
			self._updateWaitReasons();
		},
		function(err, build) {
			// ensure release executor (e.g. on error) by releasing it manually
			if (node && executorId) {
				node.releaseExecutor(executorId);
			}

			callback(err, build);
		}
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
			return self._getExecutorWaitReason(
				node,
				item.project,
				{env: item.build.env}
			);
		});

		var waitReason = _(waitReasons).compact().join(', ');
		// set only non-empty and new reasons
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

Distributor.prototype._emitBuildUpdate = function(
	originalBuild, changes, build
) {
	//@TODO: change event params on next major release - pass somithing like
	// {originalBuild, changes, build} for every event

	// always emit build update
	this.emit('buildUpdated', build, changes);

	if (
		changes.status === 'queued' &&
		originalBuild.status !== 'queued'
	) {
		this.emit('buildQueued', build);
	}

	if (
		changes.status === 'in-progress' &&
		originalBuild.status !== 'in-progress'
	) {
		this.emit('buildStarted', build);
	}

	if (changes.status && changes.status !== originalBuild.status) {
		this.emit('buildStatusChanged', build);
	}

	if (changes.completed && !originalBuild.completed) {
		this.emit('buildCompleted', build);
	}
};

Distributor.prototype._updateBuild = function(build, changes, callback) {
	var self = this;
	callback = callback || _.noop;
	var originalBuild = _(build).clone();

	Steppy(
		function() {
			if (build.id && changes.status && changes.status !== build.status) {
				logger.log(
					'Build #%s (project "%s", env: %s) change status: %s -> %s',
					build.id,
					build.project.name,
					build.env ? build.env.name : 'not set',
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
			if (!originalBuild.id && build.id) {
				logger.log(
					'Build #%s (project "%s", env: %s) %s',
					build.id,
					build.project.name,
					build.env ? build.env.name : 'not set',
					build.status
				);
			}

			// if number appear after save to db then add it to changes
			// TODO: might be better to generate number right there (instead
			// of hooks)
			if (!originalBuild.number && build.number) {
				changes.number = build.number;
			}

			// emits only after get an id (at save build)
			self._emitBuildUpdate(originalBuild, changes, build);

			this.pass(build);
		},
		callback
	);
};

Distributor.prototype.cancel = function(params, callback) {
	callback = callback || function(err) {
		if (err) logger.error('Error during cancel: ', err.stack || err);
	};
	var self = this,
		id = params.buildId;

	Steppy(
		function() {
			var queueItemIndex = _(self.queue).findIndex(function(item) {
				return item.build.id === id;
			});

			var build;

			// cancel queued build
			if (queueItemIndex !== -1) {
				build = self.queue[queueItemIndex].build;

				// remove from queue
				self.queue.splice(queueItemIndex, 1);

				// remove from db
				self.removeBuild(build, this.slot());
			} else if (self.inprogressBuildsHash[id]) {
			// cancel in progress build
				build = self.inprogressBuildsHash[id].build;

				var executor = self.inprogressBuildsHash[id].executor;
				executor.cancel(this.slot());

				// put details about cancel to inprogress hash
				self.inprogressBuildsHash[id].canceledBy = params.canceledBy;
			} else {
				throw new Error(
					'Build with id "' + id + '" not found for cancel'
				);
			}

			this.pass(build);
		},
		function(err, cancelResult, build) {
			self.emit('buildCanceled', build);

			this.pass(null);
		},
		callback
	);
};

// apply build params to project configuration, returns new project config
// (doesn't modify source project)
Distributor.prototype._makeProject = function(project, buildParams) {
	var newProject = _(project).clone();

	if (buildParams.scmRev) {
		newProject.scm = _({}).extend(project.scm, {rev: buildParams.scmRev});
	}

	return newProject;
};

Distributor.prototype.run = function(params, callback) {
	callback = callback || function(err) {
		if (err) logger.error('Error during run: ', err.stack || err);
	};

	var self = this,
		project,
		buildParams = params.buildParams || {},
		env = params.env;

	Steppy(
		function() {
			project = self._makeProject(
				self.projects.get(params.projectName),
				buildParams
			);

			if (project.archived) {
				throw new Error('Can`t run archived project "' + project.name + '"');
			}

			if (env) {
				// normalize env
				if (_(env).isString()) {
					env = {name: env};
				}
			} else if (project.envs) {
				logger.log(
					'Start individual builds for project "%s" envs: %s',
					project.name,
					_(project.envs).map(function(env) {
						return JSON.stringify(env);
					}).join(', ')
				);

				var buildGroupId = Date.now();

				// try to preserve envs order among queued builds
				var funcs = _(project.envs).map(function(env) {
					return function() {
						self.run(_({
							env: env,
							_groupId: buildGroupId
						}).defaults(params));

						process.nextTick(this.slot());
					};
				});

				funcs.push(callback);

				Steppy.apply(null, funcs);

				return;
			}

			if (params.withScmChangesOnly) {
				var node = self._getNodeForScmChangesCheck(project, params);

				if (node) {
					logger.log(
						'Check for scm changes for project "%s" on node "%s"...',
						project.name,
						node.name
					);

					node.hasScmChanges(project, params, this.slot());
				} else {
					logger.log(
						'No suitable node for check changes for project "%s" ' +
						'with params "%j", mark it as it has scm chagnes',
						project.name, params
					);

					this.pass(true);
				}
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

			var buildChanges = {
				project: project,
				initiator: params.initiator,
				params: buildParams,
				createDate: Date.now(),
				status: 'queued',
				completed: false
			};

			if (env) {
				buildChanges.env = env;
			}

			if (params._groupId) {
				buildChanges.groupId = params._groupId;
			}

			self._updateBuild({}, buildChanges, this.slot());
		},
		function(err, build) {
			self.queue.push({project: project, build: build});

			self._runNext(this.slot());
		},
		callback
	);
};
