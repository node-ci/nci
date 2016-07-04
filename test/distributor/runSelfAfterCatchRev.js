'use strict';

var expect = require('expect.js'),
	sinon = require('sinon'),
	helpers = require('../helpers'),
	distributorHelpers = require('./helpers'),
	path = require('path');

describe('Distributor run self after catch', function() {
	var distributor, executorRunSpy, scmDataSpy;

	var workspacePath = path.join(__dirname, 'workspace');

	var nodes = [{type: 'local', maxExecutorsCount: 1}];

	describe('works 3 when start from begin and catch every rev', function() {
		before(function(done) {
			helpers.removeDirIfExists(workspacePath, done);

			distributor = distributorHelpers.createDistributor({
				projects: [{
					name: 'project1',
					dir: __dirname,
					scm: helpers.repository.scm,
					steps: [
						{type: 'shell', cmd: 'echo 1'}
					],
					catchRev: {comment: /.*/}
				}],
				nodes: nodes,
				mockNode: false
			});

			var createExecutor = distributor.nodes[0]._createExecutor;
			var executor;
			distributor.nodes[0]._createExecutor = function() {
				// don't try to do it at home, in general executor should be used
				// only once. But here using it for the same project simplifies
				// tests.
				if (!executor) {
					executor = createExecutor.apply(this, arguments);
					executorRunSpy = sinon.spy(executor, 'run');
					scmDataSpy = sinon.spy();
					executor.on('scmData', scmDataSpy);
				}
				return executor;
			};
		});

		it('should run without errors', function(done) {
			distributor.run({projectName: 'project1'}, function(err, build) {
				if (err) return done(err);
				expect(build.error).not.ok();
				done();
			});
		});

		var itRunWithRev = function(callIndex, revIndex) {
			it('should run with rev ' + revIndex, function() {
				expect(executorRunSpy.getCall(callIndex).thisValue.project.name)
					.equal('project1');
				expect(scmDataSpy.getCall(callIndex).args[0].rev)
					.eql(helpers.repository.revs[revIndex]);
			});
		};

		itRunWithRev(0, 0);
		itRunWithRev(1, 1);
		itRunWithRev(2, 2);

		var revsCount = helpers.repository.revs.length;
		it('should call run ' + revsCount + ' times in total', function() {
			expect(executorRunSpy.callCount).equal(revsCount);
		});

	});

});