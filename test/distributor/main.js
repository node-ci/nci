'use strict';

var Distributor = require('../../lib/distributor').Distributor,
	expect = require('expect.js'),
	sinon = require('sinon'),
	createNodeMock = require('./helpers').createNodeMock,
	createProjectsMock = require('./helpers').createProjectsMock;


describe('Distributor main', function() {
	var distributor,
		projects = createProjectsMock([{name: 'project1'}]);

	var expectUpdateBuild = function(distributor, build, number, conditionsHash) {
		var conditions = conditionsHash[number];
		expect(distributor.queue).length(conditions.queue.length);
		expect(build.status).equal(conditions.build.status);
		if (build.status === 'error') {
			expect(build.error.message).eql(conditions.build.error.message);
		}
	};

	describe('with success project', function() {
		before(function() {
			sinon.stub(Distributor.prototype, '_createNode', createNodeMock(
				sinon.stub().callsArgAsync(1)
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
			sinon.stub(Distributor.prototype, '_createNode', createNodeMock(
				sinon.stub().callsArgWithAsync(1, new Error('Some error'))
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
			expect(changes.error.message).equal('Some error');
		});

		it('update build called 3 times in total', function() {
			expect(updateBuildSpy.callCount).equal(3);
		});

		after(function() {
			Distributor.prototype._createNode.restore();
		});
	});

	describe('with success project and build cancel', function() {
		before(function() {
			sinon.stub(Distributor.prototype, '_createNode', createNodeMock(
				sinon.stub().callsArgAsync(1)
			));
		});

		var distributorParams = {
			projects: projects,
			nodes: [{type: 'local', maxExecutorsCount: 1}],
			saveBuild: function(build, callback) {
				build.id = 1;
				callback(null, build);
			}
		};

		describe('when cancel queued buid', function() {
			var updateBuildSpy;

			var cancelError;
			it('instance should be created without errors', function() {
				distributor = new Distributor(distributorParams);

				var originalRunNext = distributor._runNext;
				distributor._runNext = function() {
					distributor.cancel({buildId: 1}, function(err) {
						cancelError = err;
					});
					originalRunNext.apply(distributor, arguments);
				};

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

			it('should be cancelled without error', function() {
				expect(cancelError).not.ok();
			});

			it('update build called only once', function() {
				expect(updateBuildSpy.callCount).equal(1);
			});
		});

		describe('when try to cancel unexisted build', function() {
			var cancelError;

			it('instance should be created without errors', function() {
				distributor = new Distributor(distributorParams);

				var originalRunNext = distributor._runNext;
				distributor._runNext = function() {
					distributor.cancel({buildId: 2}, function(err) {
						cancelError = err;
					});
					originalRunNext.apply(distributor, arguments);
				};
			});

			it('should run without errors', function(done) {
				distributor.run({projectName: 'project1'}, function(err) {
					expect(err).not.ok();
					done();
				});
			});

			it('should be cancelled with error (build not found)', function() {
				expect(cancelError).ok();
				expect(cancelError.message).eql(
					'Build with id "2" not found for cancel'
				);
			});
		});

		after(function() {
			Distributor.prototype._createNode.restore();
		});
	});
});
