'use strict';

var expect = require('expect.js'),
	sinon = require('sinon'),
	helpers = require('./helpers'),
	_ = require('underscore');


describe('Distributor main', function() {
	var distributor,
		projects = [{name: 'project1'}];

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
			expect(changes).only.have.keys('endDate', 'status', 'completed');
			expect(changes.status).equal('done');
			expect(changes.completed).equal(true);
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
});
