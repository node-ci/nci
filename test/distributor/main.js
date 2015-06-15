'use strict';

var Distributor = require('../../lib/distributor').Distributor,
	Node = require('../../lib/node').Node,
	expect = require('expect.js'),
	EventEmitter = require('events').EventEmitter,
	sinon = require('sinon')


describe('Distributor', function() {
	var distributor,
		projects = [{name: 'project1'}];

	var createNodeMock = function(executorRun) {
		return function(params) {
			var node = new Node(params);
			node._createExecutor = function() {
				var executor = new EventEmitter();
				executor.run = executorRun;
				return executor;
			};
			return node;
		};
	};

	var expectUpdateBuild = function(distributor, build, number, conditionsHash) {
		var conditions = conditionsHash[number];
		expect(distributor.queue).length(conditions.queue.length);
		expect(build.status).equal(conditions.build.status);
		if (build.status === 'error') {
			expect(build.error).eql(conditions.build.error.message);
		}
	};

	describe('with success project', function() {
		before(function() {
			var executorRun = function(params, callback) {
				setTimeout(callback, 1);
			};
			sinon.stub(Distributor.prototype, '_createNode', createNodeMock(
				executorRun
			));
		});

		var updateBuildSpy;

		it('instance should be created without errors', function() {
			distributor = new Distributor({
				projects: projects,
				nodes: [{type: 'local', maxExecutorsCount: 1}]
			});
			updateBuildSpy = sinon.spy(distributor, '_updateBuild');
		});

		it('should run without errors', function(done) {
			distributor.run({projectName: 'project1'}, function(err) {
				expect(err).not.ok();
				done();
			});
		});

		it('build should be queued', function() {
			var changes = updateBuildSpy.getCall(0).args[1];
			expect(changes).only.have.keys(
				'project', 'initiator', 'params', 'createDate', 'status',
				'completed'
			);
			expect(changes.status).equal('queued');
			expect(changes.completed).equal(false);
		});

		it('build should be in-progress', function() {
			var changes = updateBuildSpy.getCall(1).args[1];
			expect(changes).only.have.keys('startDate', 'status', 'waitReason');
			expect(changes.status).equal('in-progress');
			expect(changes.waitReason).equal('');
		});

		it('build should be done', function() {
			var changes = updateBuildSpy.getCall(2).args[1];
			expect(changes).only.have.keys(
				'endDate', 'status', 'completed', 'error'
			);
			expect(changes.status).equal('done');
			expect(changes.completed).equal(true);
			expect(changes.error).equal(null);
		});

		it('update build called 3 times in total', function() {
			expect(updateBuildSpy.callCount).equal(3);
		});

		after(function() {
			Distributor.prototype._createNode.restore();
		});
	});

	describe('with fail project', function() {
		before(function() {
			var executorRun = function(params, callback) {
				setTimeout(function() {
					callback(new Error('Some error'));
				}, 1);
			};
			sinon.stub(Distributor.prototype, '_createNode', createNodeMock(
				executorRun
			));
		});

		var updateBuildSpy;

		it('instance should be created without errors', function() {
			distributor = new Distributor({
				projects: projects,
				nodes: [{type: 'local', maxExecutorsCount: 1}]
			});
			updateBuildSpy = sinon.spy(distributor, '_updateBuild');
		});

		it('should run without errors', function(done) {
			distributor.run({projectName: 'project1'}, function(err) {
				expect(err).not.ok();
				done();
			});
		});

		it('build should be queued', function() {
			var changes = updateBuildSpy.getCall(0).args[1];
			expect(changes.status).equal('queued');
		});

		it('build should be in-progress', function() {
			var changes = updateBuildSpy.getCall(1).args[1];
			expect(changes.status).equal('in-progress');
		});

		it('build should be fail', function() {
			var changes = updateBuildSpy.getCall(2).args[1];
			expect(changes.status).equal('error');
			expect(changes.completed).equal(true);
			expect(changes.error).equal('Some error');
		});

		it('update build called 3 times in total', function() {
			expect(updateBuildSpy.callCount).equal(3);
		});

		after(function() {
			Distributor.prototype._createNode.restore();
		});
	});
});
