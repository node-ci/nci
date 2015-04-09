'use strict';

var Distributor = require('../lib/distributor').Distributor,
	Node = require('../lib/node').Node,
	expect = require('expect.js');


describe('Distributor', function() {
	var distributor,
		project1 = {name: 'project1'};

	var createNodeMock = function(executorRun) {
		return function(params) {
			var node = new Node(params);
			node._createExecutor = function() {
				return {run: executorRun};
			};
			return node;
		};
	};

	var expectUpdateBuild = function(distributor, build, number, conditionsHash) {
		var conditions = conditionsHash[number];
		expect(distributor.queue).length(conditions.queue.length);
		expect(build.status).equal(conditions.build.status);
		if (build.status === 'error') {
			expect(build.error.message).eql(conditions.build.error.message);
		}
	};

	describe('with sucess project', function() {
		var originalCreateNode;

		before(function() {
			originalCreateNode = Distributor.prototype._createNode;
			Distributor.prototype._createNode = createNodeMock(
				function(params, callback) {
					setTimeout(callback, 10);
				}
			);
		});

		it('instance should be created without errors', function() {
			var number = 1;
			var conditionsHash = {
				1: {queue: {length: 0}, build: {status: 'waiting'}},
				2: {queue: {length: 1}, build: {status: 'in-progress'}},
				3: {queue: {length: 0}, build: {status: 'done'}},
				4: 'Should never happend'
			};
			var onBuildUpdate = function(build, callback) {
				expectUpdateBuild(distributor, build, number, conditionsHash);
				number++;
				callback(null, build)
			};

			distributor = new Distributor({
				nodes: [{type: 'local', maxExecutorsCount: 1}],
				onBuildUpdate: onBuildUpdate
			});
		});

		it('should run without errors', function() {
			distributor.run(project1, {}, function(err) {
				expect(err).not.ok();
			});
		});

		it('wait for project done (should no errors)', function(done) {
			setTimeout(done, 20);
		});

		after(function() {
			Distributor.prototype._createNode = originalCreateNode;
		});
	});

	describe('with fail project', function() {
		var originalCreateNode;

		before(function() {
			originalCreateNode = Distributor.prototype._createNode;
			Distributor.prototype._createNode = createNodeMock(
				function(params, callback) {
					setTimeout(function() {
						callback(new Error('Some error'));
					}, 10);
				}
			);
		});

		it('instance should be created without errors', function() {
			var number = 1;
			var conditionsHash = {
				1: {queue: {length: 0}, build: {status: 'waiting'}},
				2: {queue: {length: 1}, build: {status: 'in-progress'}},
				3: {
					queue: {length: 0},
					build: {status: 'error', error: {message: 'Some error'}}
				},
				4: 'Should never happend'
			};
			var onBuildUpdate = function(build, callback) {
				expectUpdateBuild(distributor, build, number, conditionsHash);
				number++;
				callback(null, build)
			};

			distributor = new Distributor({
				nodes: [{type: 'local', maxExecutorsCount: 1}],
				onBuildUpdate: onBuildUpdate
			});
		});

		it('should run with errors', function() {
			distributor.run(project1, {}, function(err) {
				expect(err).not.ok();
			});
		});

		it('wait for project done (should no errors)', function(done) {
			setTimeout(done, 20);
		});

		after(function() {
			Distributor.prototype._createNode = originalCreateNode;
		});
	});
});
