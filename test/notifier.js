'use strict';

var libNotifier = require('../lib/notifier'),
	Notifier = libNotifier.Notifier,
	expect = require('expect.js'),
	sinon = require('sinon'),
	_ = require('underscore');


describe('notifier module', function() {

	var notifier = new Notifier({});

	function TestTransport() {
	}
	TestTransport.prototype.init = sinon.stub().callsArg(1);
	TestTransport.prototype.send = sinon.stub().callsArg(1);

	var sendSpy = TestTransport.prototype.send;

	describe('test notifier', function() {
		it('should be rigestered', function() {
			libNotifier.register('test', TestTransport);
		});

		it('should be intialized without errors', function(done) {
			notifier.init({}, done);
		});

		it('init method should be called once during init', function() {
			expect(TestTransport.prototype.init.calledOnce).equal(true);
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
				expect(sendSpy.called).equal(false);
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
				expect(sendSpy.called).equal(false);
				done();
			});
		});
	});

	var makeBuild = function(build) {
		var project = build.project;
		delete build.project;

		var notify = project.notify;
		delete project.notify;

		return _({
			completed: true,
			project: {
				notify: _({
					to: {test: ['recipient1', 'recipient2']}
				}).extend(notify)
			}
		}).extend(build);
	};

	describe('notify on done', function() {
		it('set build info', function() {
			build = makeBuild({
				status: 'done',
				project: {notify: {on: ['done']}}
			});
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
				notifyReason: {strategy: 'done'},
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
				expect(sendSpy.called).equal(false);
				done();
			});
		});
	});

	describe('notify on error', function() {
		it('set build info', function() {
			build = makeBuild({
				status: 'error',
				project: {notify: {on: ['error']}}
			});
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
				notifyReason: {strategy: 'error'},
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
				expect(sendSpy.called).equal(false);
				done();
			});
		});
	});

	describe('notify on canceled', function() {
		it('set build info', function() {
			build = makeBuild({
				status: 'canceled',
				project: {notify: {on: ['canceled']}}
			});
			sendSpy.reset();
		});

		it('should notify when build with canceled', function(done) {
			notifier.send(build, function(err) {
				expect(err).not.ok();
				expect(sendSpy.calledOnce).equal(true);
				done();
			});
		});

		it('should be notified with right params', function() {
			expect(sendSpy.calledWith({
				notifyReason: {strategy: 'canceled'},
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
				expect(sendSpy.called).equal(false);
				done();
			});
		});
	});

	var prevBuild;

	// for all previos build related strategies
	describe('Stub getting of previos build', function() {
		it('', function() {
			sinon.stub(notifier, '_getPrevBuild', function(build, callback) {
				callback(null, prevBuild);
			});
		});
	});

	describe('notify on change', function() {
		it('set build info', function() {
			build = makeBuild({
				number: 1,
				status: 'done',
				project: {notify: {on: ['change']}}
			});
			sendSpy.reset();
		});

		it('should notify for the first build',
			function(done) {
				notifier.send(build, function(err) {
					expect(err).not.ok();
					expect(sendSpy.calledOnce).equal(true);
					done();
				});
			}
		);

		it('should be notified with right params', function() {
			expect(sendSpy.calledWith({
				notifyReason: {strategy: 'change'},
				build: build
			})).equal(true);
		});

		it('set previos build info (same status)', function() {
			build.number = 2;
			prevBuild = _(build).clone();
			prevBuild.number = 1;
			sendSpy.reset();
		});

		it('should not notify when same previos build status', function(done) {
			notifier.send(build, function(err) {
				expect(err).not.ok();
				expect(sendSpy.called).equal(false);
				done();
			});
		});

		it('set previos build info (changed status)', function() {
			prevBuild.status = 'error';
			sendSpy.reset();
		});

		it('should notify when status is changed', function(done) {
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

	});

	describe('notify on fix', function() {
		it('set build info', function() {
			build = makeBuild({
				number: 1,
				status: 'error',
				project: {notify: {on: ['fix']}}
			});
			sendSpy.reset();
		});

		it(
			'should not notify when first build is error',
			function(done) {
				notifier.send(build, function(err) {
					expect(err).not.ok();
					expect(sendSpy.called).equal(false);
					done();
				});
			}
		);

		it('set first build status to done', function() {
			build.status = 'done';
		});

		it('should notify for the first build is done',
			function(done) {
				notifier.send(build, function(err) {
					expect(err).not.ok();
					expect(sendSpy.calledOnce).equal(true);
					done();
				});
			}
		);

		it('should be notified with right params', function() {
			expect(sendSpy.calledWith({
				notifyReason: {strategy: 'fix'},
				build: build
			})).equal(true);
		});

		it('set previos build info (same status)', function() {
			build.number = 2;
			prevBuild = _(build).clone();
			prevBuild.number = 1;
			sendSpy.reset();
		});

		it('should not notify when same previos build status', function(done) {
			notifier.send(build, function(err) {
				expect(err).not.ok();
				expect(sendSpy.called).equal(false);
				done();
			});
		});

		it('set previos build info to error', function() {
			prevBuild.status = 'error';
			sendSpy.reset();
		});

		it('should notify when status is fixed', function(done) {
			notifier.send(build, function(err) {
				expect(err).not.ok();
				expect(sendSpy.calledOnce).equal(true);
				done();
			});
		});

		it('should be notified with right params', function() {
			expect(sendSpy.calledWith({
				notifyReason: {strategy: 'fix'},
				build: build
			})).equal(true);
		});

	});

	describe('Restore getting of previos build', function() {
		it('', function() {
			notifier._getPrevBuild.restore();
		});
	});

});
