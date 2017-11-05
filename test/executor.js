'use strict';

var expect = require('expect.js'),
	path = require('path'),
	createExecutor = require('../lib/executor').createExecutor,
	_ = require('underscore'),
	helpers = require('./helpers'),
	repository = require('./helpers').repository;


_(['local']).each(function(type) {
	describe(type + ' executor', function() {
		var workspacePath = path.join(__dirname, 'workspace');

		var clearWorkspace = function(done) {
			helpers.removeDirIfExists(workspacePath, done);
		};

		var makeExecutorParams = function(params) {
			params = params || {};
			return {
				type: type,
				project: _({
					dir: __dirname,
					name: 'test project',
					scm: repository.scm,
					steps: [
						{type: 'shell', cmd: 'echo 1'},
						{type: 'shell', cmd: 'echo 2'}
					]
				}).extend(params.project)
			};
		};

		var executor, scmData;

		describe('with scm rev default and without catch rev', function() {
			before(clearWorkspace);

			it('instance should be created without errors', function() {
				executor = createExecutor(makeExecutorParams());
			});

			it('should run without errors', function(done) {
				executor.run(done);
				executor.on('scmData', function(data) {
					scmData = data;
				});
			});

			it(
				'scm data should be rev: last, changes: [0-last], is latest',
				function() {
					expect(scmData).eql({
						rev: repository.revs[repository.revs.length - 1],
						changes: repository.revs.slice().reverse(),
						isLatest: true
					});
				}
			);
		});

		var itHasScmChanges = function(value) {
			it((value ? 'should' : 'should`t') + ' has scm changes',
				function(done) {
					executor.hasScmChanges(function(err, hasScmChanges) {
						if (err) return done(err);
						expect(hasScmChanges).equal(value);
						done();
					});
				}
			);
		};

		_(['first revision', /^first revision$/]).each(function(comment) {

			describe('with scm rev default and catch rev ' + comment, function() {
				before(clearWorkspace);

				it('instance should be created without errors', function() {
					executor = createExecutor(makeExecutorParams({
						project: {
							catchRev: {comment: comment}
						}
					}));
				});

				it('should run without errors', function(done) {
					executor.run(done);
					executor.on('scmData', function(data) {
						scmData = data;
					});
				});

				it('scm data should be rev: 1, changes: [0, 1], not latest',
					function() {
						expect(scmData).eql({
							rev: repository.revs[1],
							changes: repository.revs.slice(0, 2).reverse(),
							isLatest: false
						});
					});

				itHasScmChanges(true);

				it('should run it again without errors', function(done) {
					executor.run(done);
				});

				it(
					'scm data should be rev: last, changes: [2-last], is latest',
					function() {
						expect(scmData).eql({
							rev: repository.revs[repository.revs.length - 1],
							changes: repository.revs.slice(2).reverse(),
							isLatest: true
						});
					}
				);

				itHasScmChanges(false);
			});

		});

		_(['second-revision', /^second\-revision$/]).each(function(tag) {

			describe('with scm rev default and catch tag ' + tag, function() {
				before(clearWorkspace);

				it('instance should be created without errors', function() {
					executor = createExecutor(makeExecutorParams({
						project: {
							catchRev: {tag: tag}
						}
					}));
				});

				it('should run without errors', function(done) {
					executor.run(function(err) {
						expect(err).not.ok();
						done();
					});
					executor.on('scmData', function(data) {
						scmData = data;
					});
				});

				itHasScmChanges(true);

				it('scm data should be rev: 2, changes: [0, 2], not latest',
					function() {
						expect(scmData).eql({
							rev: repository.revs[2],
							changes: repository.revs.slice(0, 3).reverse(),
							isLatest: false
						});
					});

				it('should run it again without errors', function(done) {
					executor.run(done);
				});

				it(
					'scm data should be rev: last, changes: [3-last], is latest',
					function() {
						expect(scmData).eql({
							rev: repository.revs[repository.revs.length - 1],
							changes: repository.revs.slice(3).reverse(),
							isLatest: true
						});
					}
				);

				itHasScmChanges(false);

			});

		});

		_([repository.scm.rev, new RegExp('^' + repository.scm.rev + '$')]).each(
			function(onRev) {

				describe(
					'with scm rev default and catch rev first revision ' +
					'on rev ' + onRev,
					function() {
						before(clearWorkspace);

						it('instance should be created without errors', function() {
							executor = createExecutor(makeExecutorParams({
								project: {
									catchRev: {
										onRev: onRev,
										comment: 'first revision'
									}
								}
							}));
						});

						it('should run without errors', function(done) {
							executor.run(done);
							executor.on('scmData', function(data) {
								scmData = data;
							});
						});

						it('scm data should be rev: 1, changes: [0, 1], not latest',
							function() {
								expect(scmData).eql({
									rev: repository.revs[1],
									changes: repository.revs.slice(0, 2).reverse(),
									isLatest: false
								});
							});

						itHasScmChanges(true);

						it('should run it again without errors', function(done) {
							executor.run(done);
						});

						it(
							'scm data should be rev: last, changes: [2-last], is latest',
							function() {
								expect(scmData).eql({
									rev: repository.revs[repository.revs.length - 1],
									changes: repository.revs.slice(2).reverse(),
									isLatest: true
								});
							}
						);

						itHasScmChanges(false);
					}
				);
			}
		);

		describe(
			'with scm rev default and catch rev first revision but on another rev',
			function() {
				before(clearWorkspace);

				it('instance should be created without errors', function() {
					executor = createExecutor(makeExecutorParams({
						project: {
							catchRev: {
								onRev: repository.scm.rev + '1',
								comment: 'first revision'
							}
						}
					}));
				});

				it('should run without errors', function(done) {
					executor.run(done);
					executor.on('scmData', function(data) {
						scmData = data;
					});
				});

				it(
					'scm data should be rev: last, changes: [0-last], is latest',
					function() {
						expect(scmData).eql({
							rev: repository.revs[repository.revs.length - 1],
							changes: repository.revs.slice().reverse(),
							isLatest: true
						});
					}
				);
			}
		);

	});

});
