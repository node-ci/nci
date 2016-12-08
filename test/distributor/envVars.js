'use strict';

var expect = require('expect.js'),
	sinon = require('sinon'),
	helpers = require('./helpers'),
	_ = require('underscore');

describe('Distributor build env vars usage', function() {
	var distributor;

	describe('env vars passed to create executor', function() {
		var project = {name: 'project1'},
			createExecutorSpy,
			buildId = 20,
			buildNumber = 10,
			node = {name: 'local', type: 'local', maxExecutorsCount: 1};

		it('instance should be created without errors', function() {
			distributor = helpers.createDistributor({
				projects: [project],
				nodes: [node],
				saveBuild: function(build, callback) {
					if (build.status === 'queued') {
						build.id = buildId;
					} else if (build.status === 'in-progress') {
						build.number = buildNumber;
					}
					callback(null, build);
				}
			});
			createExecutorSpy = sinon.spy(
				distributor.nodes[0],
				'_createExecutor'
			);

		});

		it('should run without errors', function(done) {
			distributor.run({projectName: project.name}, function(err) {
				expect(err).not.ok();
				done();
			});
		});

		it('should call create executor twice', function() {
			expect(createExecutorSpy.calledTwice).equal(true);
		});

		var envVars;

		it('should provide env vars for the second call', function() {
			var params = createExecutorSpy.getCall(1).args[0];
			expect(params).have.keys('envVars');
			expect(params.envVars).a('object');
			envVars = params.envVars;
		});

		it('should provide NCI_BUILD_ID env var', function() {
			expect(envVars.NCI_BUILD_ID).equal(String(buildId));
		});

		it('should provide NCI_BUILD_NUMBER env var', function() {
			expect(envVars.NCI_BUILD_NUMBER).equal(String(buildNumber));
		});

		it('should provide NCI_PROJECT_NAME env var', function() {
			expect(envVars.NCI_PROJECT_NAME).equal(project.name);
		});

		it('should provide NCI_NODE_NAME env var', function() {
			expect(envVars.NCI_NODE_NAME).equal(String(node.name));
		});
	});
});
