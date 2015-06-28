var Distributor = require('../../lib/distributor').Distributor,
	expect = require('expect.js'),
	sinon = require('sinon'),
	helpers = require('../helpers'),
	path = require('path');


describe('Distributor run self after catch', function() {
	var distributor, executorRunSpy, scmDataSpy;

	var workspacePath = path.join(__dirname, 'workspace');

	var nodes = [{type: 'local', maxExecutorsCount: 1}];

	describe('works 3 when start from begin and catch every rev', function() {
		before(function(done) {
			helpers.removeDirIfExists(workspacePath, done);

			distributor = new Distributor({
				projects: [{
					name: 'project1',
					dir: __dirname,
					scm: {
						type: 'mercurial',
						repository: path.join(__dirname, '..', 'repos', 'mercurial'),
						rev: 'default'
					},
					steps: [
						{type: 'shell', cmd: 'echo 1'}
					],
					catchRev: {comment: /.*/}
				}],
				nodes: nodes
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
			distributor.run({projectName: 'project1'}, function(err) {
				expect(err).not.ok();
				done();
			});
		});

		var itRunWithRev = function(callIndex, revIndex) {
			it('should run with rev ' + revIndex, function() {
				expect(executorRunSpy.getCall(callIndex).thisValue.project.name)
					.equal('project1');
				expect(scmDataSpy.getCall(callIndex).args[0].rev)
					.eql(helpers.mercurialRevs[revIndex]);
			});
		};

		itRunWithRev(0, 0);
		itRunWithRev(1, 1);
		itRunWithRev(2, 2);

		var revsCount = helpers.mercurialRevs.length;
		it('should call run ' + revsCount + ' times in total', function() {
			expect(executorRunSpy.callCount).equal(revsCount);
		});

	});

});