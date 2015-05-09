'use strict';

var	Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	Node = require('./node').Node;


function Distributor(params) {
	var self = this;
	// nodes to execute builds
	self.nodes = _(params.nodes).map(function(nodeParams) {
		return self._createNode(nodeParams);
	});
	// queued projects to build
	self.queue = [];

	self.onBuildUpdate = params.onBuildUpdate || function(build, callback) {
		callback(null, build);
	};

	self.onBuildData = params.onBuildData || function(build, data) {
	};
}

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

			queueItem.build.startDate = Date.now();
			queueItem.build.status = 'in-progress';
			self._updateBuild(queueItem.build, this.slot());
		},
		function(err, node, queueItemIndex, queueItem, build) {
			self.queue.splice(queueItemIndex, 1);

			var stepCallback = this.slot();
			var executor = node.run(queueItem.project, build.params, function(err) {
				build.endDate = Date.now();
				build.status = err ? 'error' : 'done';
				build.error = err;
				self._updateBuild(build, function(err, build) {
					// try to run next project from the queue
					self._runNext(stepCallback);
				});
			});

			executor.on('currentStep', function(stepLabel) {
				build.currentStep = stepLabel;
				self._updateBuild(build);
			});

			executor.on('data', function(data) {
				self.onBuildData(build, data);
			});

			executor.once('scmData', function(scmData) {
				build.scm = scmData;
				self._updateBuild(build);
			});
		},
		callback
	);
};

Distributor.prototype._updateBuild = function(build, callback) {
	callback = callback || _.noop;
	this.onBuildUpdate(build, callback);
};

Distributor.prototype.run = function(project, params, callback) {
	var self = this;
	Steppy(
		function() {
			self._updateBuild({
				project: project,
				params: params,
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
