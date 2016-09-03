'use strict';

var expect = require('expect.js'),
	sinon = require('sinon'),
	helpers = require('./helpers'),
	_ = require('underscore');


describe('Distributor main', function() {
	var distributor,
		projects = [{name: 'project1'}];

	var expectUpdateBuild = function(distributor, build, number, conditionsHash) {
		var conditions = conditionsHash[number];
		expect(distributor.queue).length(conditions.queue.length);
		expect(build.status).equal(conditions.build.status);
		if (build.status === 'error') {
			expect(build.error.message).eql(conditions.build.error.message);
		}
	};

	describe('with success project', function() {
		var updateBuildSpy;

		it('instance should be created without errors', function() {
			distributor = helpers.createDistributor({
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
			expect(changes).only.have.keys(
				'startDate', 'status', 'waitReason', 'node'
			);
			expect(changes.status).equal('in-progress');
			expect(changes.waitReason).equal('');
			expect(changes.node).eql(_(distributor.nodes[0]).pick('type', 'name'));
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
	});

	describe('with fail project', function() {
		var updateBuildSpy;

		it('instance should be created without errors', function() {
			distributor = helpers.createDistributor({
				projects: projects,
				nodes: [{type: 'local', maxExecutorsCount: 1}],
				executorRun: sinon.stub().callsArgWithAsync(
					0,
					new Error('Some error')
				)
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
	});

	describe('with success project and build cancel', function() {
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
					distributor.cancel(1, function(err) {
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
					distributor.cancel(2, function(err) {
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

	describe('with success project and buildParams.scmRev', function() {
		var project1 = {
				name: 'project1',
				scm: {type: 'mercurial', rev: '1'}
			},
			distributorParams = {
				projects: [project1],
				nodes: [{type: 'local', maxExecutorsCount: 1}]
			};

		describe('when buildParams.scmRev is not set', function() {
			var updateBuildSpy;

			it('instance should be created without errors', function() {
				distributor = helpers.createDistributor(distributorParams);
				updateBuildSpy = sinon.spy(distributor, '_updateBuild');
			});

			it('should run without errors', function(done) {
				distributor.run({projectName: 'project1'}, function(err) {
					expect(err).not.ok();
					done();
				});
			});

			it('build should be queued with proper params', function() {
				var changes = updateBuildSpy.getCall(0).args[1];
				expect(changes.params).eql({});
				expect(changes.project).eql(project1);
			});
		});

		describe('when buildParams.scmRev is set', function() {
			var updateBuildSpy,
				buildParams = {scmRev: '2'};

			it('instance should be created without errors', function() {
				distributor = helpers.createDistributor(distributorParams);
				updateBuildSpy = sinon.spy(distributor, '_updateBuild');
			});

			it('should run without errors', function(done) {
				distributor.run({
					projectName: 'project1',
					buildParams: buildParams
				}, function(err) {
					expect(err).not.ok();
					done();
				});
			});

			it('build should be queued with proper params', function() {
				var changes = updateBuildSpy.getCall(0).args[1];
				expect(changes.params).eql(buildParams);
				expect(changes.project).eql(
					_({}).extend(
						project1,
						{scm: _({}).extend(project1.scm, {rev: buildParams.scmRev})}
					)
				);
			});
		});
	});

	describe('with success project and build with env', function() {
		var updateBuildSpy;

		it('instance should be created without errors', function() {
			distributor = helpers.createDistributor({
				projects: projects,
				nodes: [{type: 'local', maxExecutorsCount: 1, envs: ['env1']}]
			});
			updateBuildSpy = sinon.spy(distributor, '_updateBuild');
		});

		it('should run without errors', function(done) {
			distributor.run({projectName: 'project1', env: 'env1'}, function(err) {
				expect(err).not.ok();
				done();
			});
		});

		it('build should be queued with env', function() {
			var changes = updateBuildSpy.getCall(0).args[1];
			expect(changes).have.keys('status', 'env');
			expect(changes.status).equal('queued');
			expect(changes.env).eql({name: 'env1'});
		});

		it('build should be in-progress', function() {
			var changes = updateBuildSpy.getCall(1).args[1];
			expect(changes).have.keys('status');
			expect(changes.status).equal('in-progress');
		});

		it('build should be done', function() {
			var changes = updateBuildSpy.getCall(2).args[1];
			expect(changes).have.keys('status');
			expect(changes.status).equal('done');
		});

		it('update build called 3 times in total', function() {
			expect(updateBuildSpy.callCount).equal(3);
		});
	});

	describe('with success project and two project envs', function() {
		var updateBuildSpy;

		it('instance should be created without errors', function() {
			var envs = ['env1', 'env2'];
			distributor = helpers.createDistributor({
				projects: [{name: 'project1', envs: envs}],
				nodes: [{type: 'local', maxExecutorsCount: 1, envs: envs}]
			});
			updateBuildSpy = sinon.spy(distributor, '_updateBuild');
		});

		it('should run without errors', function(done) {
			distributor.run({projectName: 'project1'}, function(err) {
				expect(err).not.ok();
				done();
			});
		});

		it('build for first env should be queued', function() {
			var args = updateBuildSpy.getCall(0).args,
				build = args[0],
				changes = args[1];
			expect(build.env).eql({name: 'env1'});
			expect(changes).have.keys('status');
			expect(changes.status).equal('queued');
		});

		it('build for second env should be queued', function() {
			var args = updateBuildSpy.getCall(1).args,
				build = args[0],
				changes = args[1];
			expect(build.env).eql({name: 'env2'});
			expect(changes).have.keys('status');
			expect(changes.status).equal('queued');
		});

		it('build for first env should be in-progress', function() {
			var args = updateBuildSpy.getCall(2).args,
				build = args[0],
				changes = args[1];
			expect(build.env).eql({name: 'env1'});
			expect(changes).have.keys('status');
			expect(changes.status).equal('in-progress');
		});

		it('build for first should be done', function() {
			var args = updateBuildSpy.getCall(3).args,
				build = args[0],
				changes = args[1];
			expect(build.env).eql({name: 'env1'});
			expect(changes).have.keys('status');
			expect(changes.status).equal('done');
		});

		it('build for second env should be in-progress', function() {
			var args = updateBuildSpy.getCall(4).args,
				build = args[0],
				changes = args[1];
			expect(build.env).eql({name: 'env2'});
			expect(changes).have.keys('status');
			expect(changes.status).equal('in-progress');
		});

		it('build for second should be done', function() {
			var args = updateBuildSpy.getCall(5).args,
				build = args[0],
				changes = args[1];
			expect(build.env).eql({name: 'env2'});
			expect(changes).have.keys('status');
			expect(changes.status).equal('done');
		});

		it('update build called 6 times in total', function() {
			expect(updateBuildSpy.callCount).equal(6);
		});
	});

});
