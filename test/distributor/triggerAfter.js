'use strict';

var Distributor = require('../../lib/distributor').Distributor,
	expect = require('expect.js'),
	sinon = require('sinon'),
	createNodeMock = require('./helpers').createNodeMock,
	createProjectsMock = require('./helpers').createProjectsMock;


describe('Distributor trigger after', function() {
	var distributor, executorRunSpy, projects;

	var nodes = [{type: 'local', maxExecutorsCount: 1}];

	describe('done when project is done', function() {
		before(function() {
			projects = createProjectsMock([{
				name: 'project1',
				trigger: {
					after: [{status: 'done', project: 'project2'}]
				}
			}, {
				name: 'project2'
			}]);
			executorRunSpy = sinon.stub().callsArgAsync(1);
			sinon.stub(Distributor.prototype, '_createNode', createNodeMock(
				executorRunSpy
			));
		});

		it('distributor should be created without errors', function() {
			distributor = new Distributor({projects: projects, nodes: nodes});
		});

		it('should run without errors', function(done) {
			distributor.run({projectName: 'project1'}, function(err) {
				expect(err).not.ok();
				done();
			});
		});

		it('should run project1 at first call', function() {
			expect(executorRunSpy.getCall(0).thisValue.project).eql(
				projects.get('project1')
			);
		});

		it('should run project2 at second call', function() {
			expect(executorRunSpy.getCall(1).thisValue.project).eql(
				projects.get('project2')
			);
		});

		it('should run totally 2 times', function() {
			expect(executorRunSpy.callCount).equal(2);
		});

		after(function() {
			Distributor.prototype._createNode.restore();
		});
	});

	describe('done when project is error', function() {
		before(function() {
			executorRunSpy = sinon.stub().callsArgWithAsync(1, new Error(
				'Some error'
			));
			sinon.stub(Distributor.prototype, '_createNode', createNodeMock(
				executorRunSpy
			));
		});

		it('distributor should be created without errors', function() {
			distributor = new Distributor({projects: projects, nodes: nodes});
		});

		it('should run without errors', function(done) {
			distributor.run({projectName: 'project1'}, function(err) {
				expect(err).not.ok();
				done();
			});
		});

		it('should run project1 at first call', function() {
			expect(executorRunSpy.getCall(0).thisValue.project).eql(
				projects.get('project1')
			);
		});

		it('should run totally 1 time', function() {
			expect(executorRunSpy.callCount).equal(1);
		});

		after(function() {
			Distributor.prototype._createNode.restore();
		});
	});

	describe('status is not set when project is done', function() {
		before(function() {
			projects = createProjectsMock([{
				name: 'project1',
				trigger: {
					after: [{project: 'project2'}]
				}
			}, {
				name: 'project2'
			}]);
			executorRunSpy = sinon.stub().callsArgAsync(1);
			sinon.stub(Distributor.prototype, '_createNode', createNodeMock(
				executorRunSpy
			));
		});

		it('distributor should be created without errors', function() {
			distributor = new Distributor({projects: projects, nodes: nodes});
		});

		it('should run without errors', function(done) {
			distributor.run({projectName: 'project1'}, function(err) {
				expect(err).not.ok();
				done();
			});
		});

		it('should run project1 at first call', function() {
			expect(executorRunSpy.getCall(0).thisValue.project).eql(
				projects.get('project1')
			);
		});

		it('should run project2 at second call', function() {
			expect(executorRunSpy.getCall(1).thisValue.project).eql(
				projects.get('project2')
			);
		});

		it('should run totally 2 times', function() {
			expect(executorRunSpy.callCount).equal(2);
		});

		after(function() {
			Distributor.prototype._createNode.restore();
		});
	});

	describe('status is not set when project is error', function() {
		before(function() {
			executorRunSpy = sinon.stub().callsArgWithAsync(1, new Error(
				'Some error'
			));
			sinon.stub(Distributor.prototype, '_createNode', createNodeMock(
				executorRunSpy
			));
		});

		it('distributor should be created without errors', function() {
			distributor = new Distributor({projects: projects, nodes: nodes});
		});

		it('should run without errors', function(done) {
			distributor.run({projectName: 'project1'}, function(err) {
				expect(err).not.ok();
				done();
			});
		});

		it('should run project1 at first call', function() {
			expect(executorRunSpy.getCall(0).thisValue.project).eql(
				projects.get('project1')
			);
		});

		it('should run project2 at second call', function() {
			expect(executorRunSpy.getCall(1).thisValue.project).eql(
				projects.get('project2')
			);
		});

		it('should run totally 2 times', function() {
			expect(executorRunSpy.callCount).equal(2);
		});

		after(function() {
			Distributor.prototype._createNode.restore();
		});
	});

});
