'use strict';

var	Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	Node = require('./node').Node,
	EventEmitter = require('events').EventEmitter,
	inherits = require('util').inherits;


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

			var queueItem = self.queue[queueItemIndex];
			this.pass(queueItemIndex, queueItem);

			self._updateBuild(
				queueItem.build,
				{startDate: Date.now(), status: 'in-progress'},
				this.slot()
			);
		},
		function(err, node, queueItemIndex, queueItem, build) {
			self.queue.splice(queueItemIndex, 1);

			var stepCallback = this.slot();
			var executor = node.run(queueItem.project, build.params, function(err) {
				self._updateBuild(
					build,
					{
						endDate: Date.now(),
						status: err ? 'error' : 'done',
						error: err
					},
					function(err, build) {
						// try to run next project from the queue
						self._runNext(stepCallback);
					}
				);
			});

			executor.on('currentStep', function(stepLabel) {
				self._updateBuild(build, {currentStep: stepLabel});
			});

			executor.on('data', function(data) {
				self.emit('buildData', build, data);
			});

			executor.once('scmData', function(scmData) {
				self._updateBuild(build, {scm: scmData});
			});
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

Distributor.prototype.run = function(project, params, callback) {
	var self = this;
	Steppy(
		function() {
			self._updateBuild({}, {
				project: project,
				params: params,
				createDate: Date.now(),
				status: 'queued'
			}, this.slot());
		},
		function(err, build) {
			self.queue.push({project: project, build: build});
			self._runNext(this.slot());
		},
		callback
	);
};
