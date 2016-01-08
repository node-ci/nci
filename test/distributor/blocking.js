'use strict';

var Distributor = require('../../lib/distributor').Distributor,
	expect = require('expect.js'),
	sinon = require('sinon'),
	createNodeMock = require('./helpers').createNodeMock,
	createProjectsMock = require('./helpers').createProjectsMock,
	Steppy = require('twostep').Steppy;


var expectStatus = function(spy, index, projectName, status) {
	expect(spy.getCall(index).args[0].project.name).equal(projectName);
	expect(spy.getCall(index).args[1].status).equal(status);
};

describe('Distributor blocking with max 2 executors count', function() {
	var distributor, updateBuildSpy, projects;

	var nodes = [{type: 'local', maxExecutorsCount: 2}];

	before(function() {
		sinon.stub(Distributor.prototype, '_createNode', createNodeMock(
			sinon.stub().callsArgAsync(1)
		));
	});

	var itRunParallelProjects = function() {
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
			expectStatus(updateBuildSpy, 0, 'project1', 'queued');
			expectStatus(updateBuildSpy, 1, 'project2', 'queued');
		});

		it('both projects should be in-progress', function() {
			expectStatus(updateBuildSpy, 2, 'project1', 'in-progress');
			expectStatus(updateBuildSpy, 3, 'project2', 'in-progress');
		});

		it('both projects should be done', function() {
			expectStatus(updateBuildSpy, 4, 'project1', 'done');
			expectStatus(updateBuildSpy, 5, 'project2', 'done');
		});

		it('update build called 6 times totally', function() {
			expect(updateBuildSpy.callCount).equal(6);
		});
	};

	var itRunSequentialProjects = function() {
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
			expectStatus(updateBuildSpy, 0, 'project1', 'queued');
			expectStatus(updateBuildSpy, 1, 'project2', 'queued');
		});

		it('project1 should be in-progress', function() {
			expectStatus(updateBuildSpy, 2, 'project1', 'in-progress');
		});

		it('project2 should have wait reason (project1)', function() {
			var spy = updateBuildSpy;
			expect(spy.getCall(3).args[0].project.name).equal('project2');
			expect(spy.getCall(3).args[1].waitReason).equal(
				'Blocked by currently running "project1"'
			);
		});

		it('project1 should be done', function() {
			expectStatus(updateBuildSpy, 4, 'project1', 'done');
		});

		it('project2 should be in-progress', function() {
			expectStatus(updateBuildSpy, 5, 'project2', 'in-progress');
		});

		it('project2 should be done', function() {
			expectStatus(updateBuildSpy, 6, 'project2', 'done');
		});

		it('update build called 7 times totally', function() {
			expect(updateBuildSpy.callCount).equal(7);
		});
	};

	describe('should run 2 non-blocking projects in parallel', function() {
		before(function() {
			projects = createProjectsMock([{
				name: 'project1',
			}, {
				name: 'project2'
			}]);
		});

		itRunParallelProjects();
	});

	describe('should run project1, then 2, when 2 blocked by 1', function() {
		before(function() {
			projects = createProjectsMock([{
				name: 'project1',
			}, {
				name: 'project2',
				blockedBy: ['project1']
			}]);
		});

		itRunSequentialProjects();
	});

	describe('should run project1, then 2, when 1 blocks 2', function() {
		before(function() {
			projects = createProjectsMock([{
				name: 'project1',
				blocks: ['project2']
			}, {
				name: 'project2'
			}]);
		});

		itRunSequentialProjects();
	});

	describe(
		'should run 1, 2 in parallel, when 1 block 3, 2 blocked by 3',
		function() {
			before(function() {
				projects = createProjectsMock([{
					name: 'project1',
					blocks: ['project3']
				}, {
					name: 'project2',
					blockedBy: ['project3']
				}, {
					name: 'project3'
				}]);
			});

			itRunParallelProjects();
		}
	);

	after(function() {
		Distributor.prototype._createNode.restore();
	});

});
