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

	describe('when cancel queued bulid', function() {
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
