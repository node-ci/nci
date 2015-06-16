'use strict';

var Distributor = require('../../lib/distributor').Distributor,
	expect = require('expect.js'),
	sinon = require('sinon'),
	createNodeMock = require('./helpers').createNodeMock,
	Steppy = require('twostep').Steppy;


describe('Distributor blocking', function() {
	var distributor, updateBuildSpy, projects;

	var nodes = [{type: 'local', maxExecutorsCount: 2}];

	before(function() {
		sinon.stub(Distributor.prototype, '_createNode', createNodeMock(
			sinon.stub().callsArgAsync(1)
		));
	});

	describe('should no work when two non-blocking projects run', function() {
		before(function() {
			projects = [{
				name: 'project1',
			}, {
				name: 'project2'
			}];
		});

		it('distributor should be created without errors', function() {
			distributor = new Distributor({projects: projects, nodes: nodes});
			updateBuildSpy = sinon.spy(distributor, '_updateBuild');
		});

		it('should run both projects without errors', function(done) {
			Steppy(
				function() {
					distributor.run({projectName: 'project1'}, this.slot());
					distributor.run({projectName: 'project2'}, this.slot());
				},
				function(err) {
					expect(err).not.ok();
					this.pass(null);
				},
				done
			);
		});

		it('both projects should be queued', function() {
			var spy = updateBuildSpy;
			expect(spy.getCall(0).args[0].project.name).equal('project1');
			expect(spy.getCall(0).args[1].status).equal('queued');
			expect(spy.getCall(1).args[0].project.name).equal('project2');
			expect(spy.getCall(1).args[1].status).equal('queued');
		});

		it('both projects should be in-progress', function() {
			var spy = updateBuildSpy;
			expect(spy.getCall(2).args[0].project.name).equal('project1');
			expect(spy.getCall(2).args[1].status).equal('in-progress');
			expect(spy.getCall(3).args[0].project.name).equal('project2');
			expect(spy.getCall(3).args[1].status).equal('in-progress');
		});
	});

	describe('should work project2 blocked by project1', function() {
		before(function() {
			projects = [{
				name: 'project1',
			}, {
				name: 'project2',
				blockedBy: ['project1']
			}];
		});

		it('distributor should be created without errors', function() {
			distributor = new Distributor({projects: projects, nodes: nodes});
			updateBuildSpy = sinon.spy(distributor, '_updateBuild');
		});

		it('should run both projects without errors', function(done) {
			Steppy(
				function() {
					distributor.run({projectName: 'project1'}, this.slot());
					distributor.run({projectName: 'project2'}, this.slot());
				},
				function(err) {
					expect(err).not.ok();
					this.pass(null);
				},
				done
			);
		});

		it('both projects should be queued', function() {
			var spy = updateBuildSpy;
			expect(spy.getCall(0).args[0].project.name).equal('project1');
			expect(spy.getCall(0).args[1].status).equal('queued');
			expect(spy.getCall(1).args[0].project.name).equal('project2');
			expect(spy.getCall(1).args[1].status).equal('queued');
		});

		it('project1 should be in-progress', function() {
			var spy = updateBuildSpy;
			expect(spy.getCall(2).args[0].project.name).equal('project1');
			expect(spy.getCall(2).args[1].status).equal('in-progress');
		});

		it('project2 should have wait reason (project1)', function() {
			var spy = updateBuildSpy;
			expect(spy.getCall(3).args[0].project.name).equal('project2');
			expect(spy.getCall(3).args[1].waitReason).equal(
				'Blocked by currently running "project1"'
			);
		});
	});

});
