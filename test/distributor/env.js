'use strict';

var expect = require('expect.js'),
	sinon = require('sinon'),
	helpers = require('./helpers'),
	_ = require('underscore');

describe('Distributor usage with environments', function() {
	var distributor;

	describe('run project with envs', function() {
		var project = {name: 'project1', envs: ['env1', 'env2']},
			runSpy,
			updateBuildSpy;

		it('instance should be created without errors', function() {
			distributor = helpers.createDistributor({
				projects: [project],
				nodes: [{type: 'local', maxExecutorsCount: 1, envs: project.envs}]
			});
			runSpy = sinon.spy(distributor, 'run');
			updateBuildSpy = sinon.spy(distributor, '_updateBuild');
		});

		var runErr, runResult;

		it('should run without sync errors', function(done) {
			distributor.run({projectName: project.name}, function(err, result) {
				runErr = err;
				runResult = result;
				done();
			});
		});

		it('should not return error at run result', function() {
			expect(runErr).not.ok();
		});

		it('should return builds at run result', function() {
			expect(runResult).ok();
			expect(runResult).only.have.keys('builds');
			expect(runResult.builds).an('array');
			expect(runResult.builds).length(2);
			expect(runResult.builds[0]).an('object');
			expect(runResult.builds[0]).have.keys(
				'id', 'status', 'completed', 'project', 'params', 'createDate'
			);
			expect(runResult.builds[1]).an('object');
			expect(runResult.builds[1]).have.keys(
				'id', 'status', 'completed', 'project', 'params', 'createDate'
			);
		});

		it('run should be called with original params', function() {
			var params = runSpy.getCall(0).args[0];
			expect(params).eql({projectName: project.name});
		});

		var _groupId;

		it('run should be called with ' + project.envs[0], function() {
			var params = runSpy.getCall(1).args[0];
			expect(params).only.have.keys('projectName', 'env', '_groupId');
			expect(params.projectName).equal(project.name);
			expect(params.env).equal(project.envs[0]);
			expect(params._groupId).a('number');
			expect(params._groupId).above(0);
			_groupId = params._groupId;
		});

		it('run should be called with ' + project.envs[1], function() {
			var params = runSpy.getCall(2).args[0];
			expect(params).only.have.keys('projectName', 'env', '_groupId');
			expect(params.projectName).equal(project.name);
			expect(params.env).equal(project.envs[1]);
			expect(params._groupId).a('number');
			expect(params._groupId).equal(_groupId);
		});

		it('both builds should be queued with groupId', function() {
			var firstGroupId, secondGroupId;

			_(updateBuildSpy.getCalls()).each(function(call) {
				var changes = call.args[1];
				if (changes.status === 'queued') {
					if (changes.env && changes.env.name === project.envs[0]) {
						firstGroupId = changes.groupId;
					} else if (changes.env && changes.env.name === project.envs[1]) {
						secondGroupId = changes.groupId;
					}
				}
			});

			expect(firstGroupId).equal(_groupId);
			expect(firstGroupId).equal(secondGroupId);
		});

		it('run called 3 times in total', function() {
			expect(runSpy.callCount).equal(3);
		});
	});

	describe('run (with env) project', function() {
		var project = {name: 'project1'},
			env = 'env1',
			runSpy,
			updateBuildSpy;

		it('instance should be created without errors', function() {
			distributor = helpers.createDistributor({
				projects: [project],
				nodes: [{type: 'local', maxExecutorsCount: 1, envs: [env]}]
			});
			runSpy = sinon.spy(distributor, 'run');
			updateBuildSpy = sinon.spy(distributor, '_updateBuild');
		});

		var runErr, runResult;

		it('should run without sync errors', function(done) {
			distributor.run(
				{projectName: project.name, env: env},
				function(err, result) {
					runErr = err;
					runResult = result;
					done();
				}
			);
		});

		it('should not return error at run result', function() {
			expect(runErr).not.ok();
		});

		it('should return builds at run result', function() {
			expect(runResult).ok();
			expect(runResult).only.have.keys('builds');
			expect(runResult.builds).an('array');
			expect(runResult.builds).length(1);
			expect(runResult.builds[0]).an('object');
			expect(runResult.builds[0]).have.keys(
				'id', 'status', 'completed', 'project', 'params', 'createDate'
			);
		});

		it('run called only once', function() {
			expect(runSpy.callCount).equal(1);
		});

		it('build should be queued with env', function() {
			var changes = updateBuildSpy.getCall(0).args[1];
			expect(changes).have.keys('status', 'env');
			expect(changes.env).eql({name: env});
			expect(changes.status).equal('queued');
			expect(changes.completed).equal(false);
		});

		it('build should be in-progress', function() {
			var changes = updateBuildSpy.getCall(1).args[1];
			expect(changes.status).equal('in-progress');
		});

		it('build should be done', function() {
			var changes = updateBuildSpy.getCall(2).args[1];
			expect(changes.status).equal('done');
		});

		it('update build called 3 times in total', function() {
			expect(updateBuildSpy.callCount).equal(3);
		});
	});
});
