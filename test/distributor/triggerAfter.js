'use strict';

var expect = require('expect.js'),
	sinon = require('sinon'),
	helpers = require('./helpers');


describe('Distributor trigger after', function() {
	var distributor, executorRunSpy, projects;

	var nodes = [{type: 'local', maxExecutorsCount: 1}];

	describe('done when project is done', function() {
		before(function() {
			projects = [{
				name: 'project1',
				trigger: {
					after: [{status: 'done', project: 'project2'}]
				}
			}, {
				name: 'project2'
			}];
			executorRunSpy = sinon.stub().callsArgAsync(0);
		});

		it('distributor should be created without errors', function() {
			distributor = helpers.createDistributor({
				projects: projects,
				nodes: nodes,
				executorRun: executorRunSpy
			});
		});

		it('should run without errors', function(done) {
			distributor.run({projectName: 'project1'}, function(err) {
				expect(err).not.ok();
				done();
			});
		});

		it('should run project1 at first call', function() {
			expect(executorRunSpy.getCall(0).thisValue.project).eql(projects[0]);
		});

		it('should run project2 at second call', function() {
			expect(executorRunSpy.getCall(1).thisValue.project).eql(projects[1]);
		});

		it('should run totally 2 times', function() {
			expect(executorRunSpy.callCount).equal(2);
		});
	});

	describe('done when project is error', function() {
		before(function() {
			executorRunSpy = sinon.stub().callsArgWithAsync(
				0,
				helpers.createExecutorProjectStepError({message: 'Some error'})
			);
		});

		it('distributor should be created without errors', function() {
			distributor = helpers.createDistributor({
				projects: projects,
				nodes: nodes,
				executorRun: executorRunSpy
			});
		});

		it('should run without errors', function(done) {
			distributor.run({projectName: 'project1'}, function(err) {
				expect(err).not.ok();
				done();
			});
		});

		it('should run project1 at first call', function() {
			expect(executorRunSpy.getCall(0).thisValue.project).eql(projects[0]);
		});

		it('should run totally 1 time', function() {
			expect(executorRunSpy.callCount).equal(1);
		});
	});

	describe('status is not set when project is done', function() {
		before(function() {
			projects = [{
				name: 'project1',
				trigger: {
					after: [{project: 'project2'}]
				}
			}, {
				name: 'project2'
			}];
			executorRunSpy = sinon.stub().callsArgAsync(0);
		});

		it('distributor should be created without errors', function() {
			distributor = helpers.createDistributor({
				projects: projects,
				nodes: nodes,
				executorRun: executorRunSpy
			});
		});

		it('should run without errors', function(done) {
			distributor.run({projectName: 'project1'}, function(err) {
				expect(err).not.ok();
				done();
			});
		});

		it('should run project1 at first call', function() {
			expect(executorRunSpy.getCall(0).thisValue.project).eql(projects[0]);
		});

		it('should run project2 at second call', function() {
			expect(executorRunSpy.getCall(1).thisValue.project).eql(projects[1]);
		});

		it('should run totally 2 times', function() {
			expect(executorRunSpy.callCount).equal(2);
		});
	});

	describe('status is not set when project is error', function() {
		before(function() {
			executorRunSpy = sinon.stub().callsArgWithAsync(
				0,
				helpers.createExecutorProjectStepError({message: 'Some error'})
			);
		});

		it('distributor should be created without errors', function() {
			distributor = helpers.createDistributor({
				projects: projects,
				nodes: nodes,
				executorRun: executorRunSpy
			});
		});

		it('should run without errors', function(done) {
			distributor.run({projectName: 'project1'}, function(err) {
				expect(err).not.ok();
				done();
			});
		});

		it('should run project1 at first call', function() {
			expect(executorRunSpy.getCall(0).thisValue.project).eql(projects[0]);
		});

		it('should run project2 at second call', function() {
			expect(executorRunSpy.getCall(1).thisValue.project).eql(projects[1]);
		});

		it('should run totally 2 times', function() {
			expect(executorRunSpy.callCount).equal(2);
		});
	});

});
