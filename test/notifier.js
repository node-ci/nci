'use strict';

var notifier = require('../lib/notifier'),
	expect = require('expect.js'),
	sinon = require('sinon'),
	_ = require('underscore');


describe('notifier module', function() {

	function TestNotifier() {
	}
	TestNotifier.prototype.init = sinon.stub().callsArg(1);
	TestNotifier.prototype.send = sinon.stub().callsArg(1);

	var sendSpy = TestNotifier.prototype.send;

	describe('test notifier', function() {
		it('should be rigestered', function() {
			notifier.register('test', TestNotifier);
		});

		it('should be intialized without errors', function(done) {
			notifier.init({}, done);
		});

		it('init method should be called once during init', function() {
			expect(TestNotifier.prototype.init.calledOnce).equal(true);
		});
	});

	var build;

	describe('exceptions', function() {
		it('set build to uncompleted', function() {
			build = {completed: false};
			sendSpy.reset();
		});

		it('error should be thrown for uncompleted build', function(done) {
			notifier.send(build, function(err) {
				expect(err).ok();
				expect(err.message).match(/Build should be completed/);
				expect(sendSpy.calledOnce).equal(false);
				done();
			});
		});

		it('set build to completed', function() {
			build = {completed: true, status: 'done', project: {}};
			sendSpy.reset();
		});

		it('will do nothing if notify section isn`t set for project', function(done) {
			notifier.send(build, function(err) {
				expect(err).not.ok();
				expect(sendSpy.calledOnce).equal(false);
				done();
			});
		});
	});

	describe('notify on success', function() {
		it('set build info', function() {
			build = {
				completed: true,
				status: 'done',
				project: {
					notify: {
						on: ['success'],
						to: {test: ['recipient1', 'recipient2']}
					}
				}
			};
			sendSpy.reset();
		});

		it('should notify when build is done', function(done) {
			notifier.send(build, function(err) {
				expect(err).not.ok();
				expect(sendSpy.calledOnce).equal(true);
				done();
			});
		});

		it('should be notified with right params', function() {
			expect(sendSpy.calledWith({
				notifyReason: {strategy: 'success'},
				build: build
			})).equal(true);
		});

		it('set build to error', function() {
			build.status = 'error';
			sendSpy.reset();
		});

		it('should not notify when build is error', function(done) {
			notifier.send(build, function(err) {
				expect(err).not.ok();
				expect(sendSpy.calledOnce).equal(false);
				done();
			});
		});
	});

	describe('notify on fail', function() {
		it('set build info', function() {
			build = {
				completed: true,
				status: 'error',
				project: {
					notify: {
						on: ['fail'],
						to: {test: ['recipient1', 'recipient2']}
					}
				}
			};
			sendSpy.reset();
		});

		it('should notify when build with error', function(done) {
			notifier.send(build, function(err) {
				expect(err).not.ok();
				expect(sendSpy.calledOnce).equal(true);
				done();
			});
		});

		it('should be notified with right params', function() {
			expect(sendSpy.calledWith({
				notifyReason: {strategy: 'fail'},
				build: build
			})).equal(true);
		});

		it('set build to done', function() {
			build.status = 'done';
			sendSpy.reset();
		});

		it('should not notify when build is done', function(done) {
			notifier.send(build, function(err) {
				expect(err).not.ok();
				expect(sendSpy.calledOnce).equal(false);
				done();
			});
		});
	});

	var secondBuild;

	// for all previos build related strategies
	describe('Stub getting of previos build', function() {
		it('', function() {
			sinon.stub(notifier, '_getPrevBuild').callsArgWith(1, null, build);
		});
	});

	describe('notify on change', function() {
		it('set build info', function() {
			build = {
				completed: true,
				status: 'done',
				number: 1,
				project: {
					name: 'project1',
					notify: {
						on: ['change'],
						to: {test: ['recipient1', 'recipient2']}
					}
				}
			};
			sendSpy.reset();
		});

		it('should notify for the first build', function(done) {
			notifier.send(build, function(err) {
				expect(err).not.ok();
				expect(sendSpy.calledOnce).equal(true);
				done();
			});
		});

		it('should be notified with right params', function() {
			expect(sendSpy.calledWith({
				notifyReason: {strategy: 'change'},
				build: build
			})).equal(true);
		});

		it('set second build info (same status)', function() {
			secondBuild = _(build).clone();
			secondBuild.number = 2;
			sendSpy.reset();
		});

		it('should not notify when same second build status', function(done) {
			notifier.send(secondBuild, function(err) {
				expect(err).not.ok();
				expect(sendSpy.calledOnce).equal(false);
				done();
			});
		});

		it('set second build info (changed status)', function() {
			secondBuild.status = 'error';
			sendSpy.reset();
		});

		it('should notify when status is changed', function(done) {
			notifier.send(secondBuild, function(err) {
				expect(err).not.ok();
				expect(sendSpy.calledOnce).equal(true);
				done();
			});
		});

		it('should be notified with right params', function() {
			expect(sendSpy.calledWith({
				notifyReason: {strategy: 'change'},
				build: secondBuild
			})).equal(true);
		});

	});

	describe('Restore getting of previos build', function() {
		it('', function() {
			notifier._getPrevBuild.restore();
		});
	});

});
