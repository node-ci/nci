'use strict';

var expect = require('expect.js'),
	sinon = require('sinon'),
	helpers = require('./helpers'),
	_ = require('underscore');

describe('Distributor build env vars usage', function() {
	var distributor;

	var nciEnvVars = [
		'NCI_BUILD_ID', 'NCI_BUILD_NUMBER', 'NCI_PROJECT_NAME', 'NCI_NODE_NAME',
		'NCI_ENV_NAME'
	];

	describe('without project env vars', function() {
		var project = {name: 'project1'},
			runExecutorSpy,
			buildId = 20,
			buildNumber = 10,
			env = {name: 'someEnv'},
			node = {
				name: 'local',
				type: 'local',
				maxExecutorsCount: 1,
				envs: ['someEnv']
			};

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

			runExecutorSpy = sinon.spy(distributor.nodes[0], 'runExecutor');

		});

		it('should run without errors', function(done) {
			distributor.run({projectName: project.name, env: env}, function(err) {
				expect(err).not.ok();
				done();
			});
		});

		var envVars;

		it('should provide env vars for runExecutor call', function() {
			var params = runExecutorSpy.getCall(0).args[1];
			expect(params).have.keys('envVars');
			expect(params.envVars).a('object');
			envVars = params.envVars;
		});

		it('should provide only nci specific env vars', function() {
			expect(envVars).only.have.keys(nciEnvVars);
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

		it('should provide NCI_ENV_NAME env var', function() {
			expect(envVars.NCI_ENV_NAME).equal(String(env.name));
		});
	});

	describe('with project env vars', function() {
		var project = {
				name: 'project1',
				envVars: {
					someVar: 'someValue'
				}
			},
			runExecutorSpy,
			env = {name: 'someEnv'},
			node = {
				name: 'local',
				type: 'local',
				maxExecutorsCount: 1,
				envs: ['someEnv']
			};

		it('instance should be created without errors', function() {
			distributor = helpers.createDistributor({
				projects: [project],
				nodes: [node]
			});

			runExecutorSpy = sinon.spy(distributor.nodes[0], 'runExecutor');

		});

		it('should run without errors', function(done) {
			distributor.run({projectName: project.name, env: env}, function(err) {
				expect(err).not.ok();
				done();
			});
		});

		var envVars;

		it('should provide env vars for runExecutor call', function() {
			var params = runExecutorSpy.getCall(0).args[1];
			expect(params).have.keys('envVars');
			expect(params.envVars).a('object');
			envVars = params.envVars;
		});

		it('should provide nci specific env vars', function() {
			expect(envVars).have.keys(nciEnvVars);
		});

		it('should provide project env vars', function() {
			expect(envVars.someVar).equal('someValue');
		});

	});

	describe('with node env vars', function() {
		var project = {
				name: 'project1'
			},
			runExecutorSpy,
			env = {name: 'someEnv'},
			node = {
				name: 'local',
				type: 'local',
				maxExecutorsCount: 1,
				envs: ['someEnv'],
				envVars: {
					someVar: 'someValue'
				}
			};

		it('instance should be created without errors', function() {
			distributor = helpers.createDistributor({
				projects: [project],
				nodes: [node]
			});

			runExecutorSpy = sinon.spy(distributor.nodes[0], 'runExecutor');

		});

		it('should run without errors', function(done) {
			distributor.run({projectName: project.name, env: env}, function(err) {
				expect(err).not.ok();
				done();
			});
		});

		var envVars;

		it('should provide env vars for runExecutor call', function() {
			var params = runExecutorSpy.getCall(0).args[1];
			expect(params).have.keys('envVars');
			expect(params.envVars).a('object');
			envVars = params.envVars;
		});

		it('should provide nci specific env vars', function() {
			expect(envVars).have.keys(nciEnvVars);
		});

		it('should provide node env vars', function() {
			expect(envVars.someVar).equal('someValue');
		});

	});

	describe('with overrinding project and node env var', function() {
		var project = {
				name: 'project1',
				envVars: {
					someVar: 'someProjectValue'
				}
			},
			runExecutorSpy,
			env = {name: 'someEnv'},
			node = {
				name: 'local',
				type: 'local',
				maxExecutorsCount: 1,
				envs: ['someEnv'],
				envVars: {
					someVar: 'someNodeValue'
				}
			};

		it('instance should be created without errors', function() {
			distributor = helpers.createDistributor({
				projects: [project],
				nodes: [node]
			});

			runExecutorSpy = sinon.spy(distributor.nodes[0], 'runExecutor');

		});

		it('should run without errors', function(done) {
			distributor.run({projectName: project.name, env: env}, function(err) {
				expect(err).not.ok();
				done();
			});
		});

		var envVars;

		it('should provide env vars for runExecutor call', function() {
			var params = runExecutorSpy.getCall(0).args[1];
			expect(params).have.keys('envVars');
			expect(params.envVars).a('object');
			envVars = params.envVars;
		});

		it('should provide nci specific env vars', function() {
			expect(envVars).have.keys(nciEnvVars);
		});

		it('should prefer project env var value', function() {
			expect(envVars.someVar).equal('someProjectValue');
		});

	});

	describe('with overrinding nci, project and node env var', function() {
		var project = {
				name: 'project1',
				envVars: {
					NCI_NODE_NAME: 'someProjectValue'
				}
			},
			runExecutorSpy,
			env = {name: 'someEnv'},
			node = {
				name: 'local',
				type: 'local',
				maxExecutorsCount: 1,
				envs: ['someEnv'],
				envVars: {
					NCI_NODE_NAME: 'someNodeValue'
				}
			};

		it('instance should be created without errors', function() {
			distributor = helpers.createDistributor({
				projects: [project],
				nodes: [node]
			});

			runExecutorSpy = sinon.spy(distributor.nodes[0], 'runExecutor');

		});

		it('should run without errors', function(done) {
			distributor.run({projectName: project.name, env: env}, function(err) {
				expect(err).not.ok();
				done();
			});
		});

		var envVars;

		it('should provide env vars for runExecutor call', function() {
			var params = runExecutorSpy.getCall(0).args[1];
			expect(params).have.keys('envVars');
			expect(params.envVars).a('object');
			envVars = params.envVars;
		});

		it('should provide nci specific env vars', function() {
			expect(envVars).have.keys(nciEnvVars);
		});

		it('should prefer nci specific env var value', function() {
			expect(envVars.NCI_NODE_NAME).equal(node.name);
		});

	});
});
