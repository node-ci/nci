'use strict';

var expect = require('expect.js'),
	sinon = require('sinon'),
	helpers = require('./helpers'),
	_ = require('underscore');


describe('Distributor cancel method', function() {
	var distributor,
		projects = [{name: 'project1'}];

	var distributorParams = {
		projects: projects,
		nodes: [{type: 'local', maxExecutorsCount: 1}],
		saveBuild: function(build, callback) {
			build.id = 1;
			callback(null, build);
		}
	};

	describe('when cancel queued build', function() {
		var updateBuildSpy;

		var cancelError;
		it('instance should be created without errors', function() {
			distributor = helpers.createDistributor(distributorParams);

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
			expect(changes).have.keys('status');
			expect(changes.status).equal('queued');
		});

		it('should be cancelled without error', function() {
			expect(cancelError).not.ok();
		});

		it('update build called only once', function() {
			expect(updateBuildSpy.callCount).equal(1);
		});
	});

	describe('when cancel running build', function() {
		var updateBuildSpy, canceledBy = {type: 'user'};

		var cancelError;
		it('instance should be created without errors', function() {
			distributor = helpers.createDistributor(_({
				executorRun: function(callback) {
					distributor.cancel({
						buildId: 1,
						canceledBy: canceledBy
					}, function(err) {
						cancelError = err;

						// that's usually happend when you kill something
						callback(new Error(
							'Spawned command exits with non-zero exit code: null'
						));
					});
				},
				executorCancel: function(callback) {
					this.canceled = true;
					distributor.inprogressBuildsHash[1].canceledBy = canceledBy;
					callback();
				}
			}).defaults(distributorParams));

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
			expect(changes).have.keys('status');
			expect(changes.status).equal('queued');
		});

		it('build should be in-progress', function() {
			var changes = updateBuildSpy.getCall(1).args[1];
			expect(changes).have.keys('status');
			expect(changes.status).equal('in-progress');
		});

		it('build should be canceled', function() {
			var changes = updateBuildSpy.getCall(2).args[1];
			expect(changes).only.have.keys(
				'status', 'endDate', 'completed', 'canceledBy'
			);
			expect(changes.status).equal('canceled');
			expect(changes.completed).equal(true);
			expect(changes.canceledBy).eql(canceledBy);
		});

		it('should be cancelled without error', function() {
			expect(cancelError).not.ok();
		});

		it('update build called 3 times in total', function() {
			expect(updateBuildSpy.callCount).equal(3);
		});
	});

	describe('when try to cancel unexisted build', function() {
		var cancelError;

		it('instance should be created without errors', function() {
			distributor = helpers.createDistributor(distributorParams);

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

});
