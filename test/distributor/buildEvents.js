'use strict';

var expect = require('expect.js'),
	sinon = require('sinon'),
	helpers = require('./helpers'),
	_ = require('underscore');


describe('Distributor build events', function() {
	var project = {name: 'project1'},
		projects = [project];

	var expectStatus = function(spy, index, status) {
		expect(spy.getCall(index).args[0].project.name).equal(project.name);
		expect(spy.getCall(index).args[1].status).equal(status);
	};

	describe('with success project', function() {
		var distributor, updateBuildSpy, emitSpy;

		it('instance should be created without errors', function() {
			distributor = helpers.createDistributor({
				projects: projects,
				nodes: [{type: 'local', maxExecutorsCount: 1}]
			});
			updateBuildSpy = sinon.spy(distributor, '_updateBuild');
			emitSpy = sinon.spy(distributor, 'emit');
		});

		it('should run without errors', function(done) {
			distributor.run({projectName: 'project1'}, function(err) {
				expect(err).not.ok();
				done();
			});
		});

		it('should queue build', function() {
			expectStatus(updateBuildSpy, 0, 'queued');
		});

		it('should emit buildUpdated for queued build', function() {
			var eventName = emitSpy.getCall(0).args[0];
			expect(eventName).equal('buildUpdated');
		});

		it('should emit buildQueued for queued build', function() {
			var eventName = emitSpy.getCall(1).args[0];
			expect(eventName).equal('buildQueued');
		});

		it('should emit buildStatusChanged for queued build', function() {
			var eventName = emitSpy.getCall(2).args[0];
			expect(eventName).equal('buildStatusChanged');
		});

		it('should in-progress build', function() {
			expectStatus(updateBuildSpy, 1, 'in-progress');
		});

		it('should emit buildUpdated for in-progress build', function() {
			var eventName = emitSpy.getCall(3).args[0];
			expect(eventName).equal('buildUpdated');
		});

		it('should emit buildStarted for in-progress build', function() {
			var eventName = emitSpy.getCall(4).args[0];
			expect(eventName).equal('buildStarted');
		});

		it('should emit buildStatusChanged for in-progress build', function() {
			var eventName = emitSpy.getCall(5).args[0];
			expect(eventName).equal('buildStatusChanged');
		});

		it('should done build', function() {
			expectStatus(updateBuildSpy, 2, 'done');
		});

		it('should emit buildUpdated for done build', function() {
			var eventName = emitSpy.getCall(6).args[0];
			expect(eventName).equal('buildUpdated');
		});

		it('should emit buildStatusChanged for done build', function() {
			var eventName = emitSpy.getCall(7).args[0];
			expect(eventName).equal('buildStatusChanged');
		});

		it('should emit buildCompleted for done build', function() {
			var eventName = emitSpy.getCall(8).args[0];
			expect(eventName).equal('buildCompleted');
		});
	});

	describe('with fail project', function() {
		var distributor, updateBuildSpy, emitSpy;

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
			emitSpy = sinon.spy(distributor, 'emit');
		});

		it('should run without errors', function(done) {
			distributor.run({projectName: 'project1'}, function(err) {
				expect(err).not.ok();
				done();
			});
		});

		it('should queue build', function() {
			expectStatus(updateBuildSpy, 0, 'queued');
		});

		it('should emit buildUpdated for queued build', function() {
			var eventName = emitSpy.getCall(0).args[0];
			expect(eventName).equal('buildUpdated');
		});

		it('should emit buildQueued for queued build', function() {
			var eventName = emitSpy.getCall(1).args[0];
			expect(eventName).equal('buildQueued');
		});

		it('should emit buildStatusChanged for queued build', function() {
			var eventName = emitSpy.getCall(2).args[0];
			expect(eventName).equal('buildStatusChanged');
		});

		it('should in-progress build', function() {
			expectStatus(updateBuildSpy, 1, 'in-progress');
		});

		it('should emit buildUpdated for in-progress build', function() {
			var eventName = emitSpy.getCall(3).args[0];
			expect(eventName).equal('buildUpdated');
		});

		it('should emit buildStarted for in-progress build', function() {
			var eventName = emitSpy.getCall(4).args[0];
			expect(eventName).equal('buildStarted');
		});

		it('should emit buildStatusChanged for in-progress build', function() {
			var eventName = emitSpy.getCall(5).args[0];
			expect(eventName).equal('buildStatusChanged');
		});

		it('should error build', function() {
			expectStatus(updateBuildSpy, 2, 'error');
		});

		it('should emit buildUpdated for error build', function() {
			var eventName = emitSpy.getCall(6).args[0];
			expect(eventName).equal('buildUpdated');
		});

		it('should emit buildStatusChanged for error build', function() {
			var eventName = emitSpy.getCall(7).args[0];
			expect(eventName).equal('buildStatusChanged');
		});

		it('should emit buildCompleted for error build', function() {
			var eventName = emitSpy.getCall(8).args[0];
			expect(eventName).equal('buildCompleted');
		});

	});

});
