'use strict';

var createNode = require('../lib/node').createNode,
	expect = require('expect.js'),
	_ = require('underscore');


describe('Node', function() {
	var node,
		project1 = {name: 'project1'},
		project2 = {name: 'project2'};

	var createNodeMock = function(params) {
		params = params || {};

		var node = createNode(_({
			name: 'executor1',
			type: 'local',
			maxExecutorsCount: 1,
			usageStrategy: 'maximum'
		}).extend(params));

		// only for testing
		if (params.executors) {
			node.executors = params.executors;
		}
		return node;
	};

	describe('wait reason', function() {

		it('should be not a target node when node target is not match', function() {
			var waitReason = createNodeMock({
				name: 'executor1'
			}).getExecutorWaitReason({
				name: 'project1',
				node: {target: 'other executor'}
			});
			expect(waitReason).eql('executor1: not a target node');
		});

		it('should be falsy when node target match', function() {
			var waitReason = createNodeMock({
				name: 'executor1'
			}).getExecutorWaitReason({
				name: 'project1',
				node: {target: 'executor1'}
			});
			expect(waitReason).not.ok();
		});

		it('should be falsy when node target (array) match', function() {
			var waitReason = createNodeMock({
				name: 'executor1'
			}).getExecutorWaitReason({
				name: 'project1',
				node: {target: ['executor1']}
			});
			expect(waitReason).not.ok();
		});

		it('should be only for specific projects when target is not set', function() {
			var waitReason = createNodeMock({
				usageStrategy: 'specificProject'
			}).getExecutorWaitReason({
				name: 'project1'
			});
			expect(waitReason).eql('executor1: only for specific projects');
		});

		it('should be all executors are busy when true', function() {
			var waitReason = createNodeMock({
				maxExecutorsCount: 1,
				executors: {project2: 1}
			}).getExecutorWaitReason({
				name: 'project1'
			});
			expect(waitReason).eql('executor1: all executors are busy');
		});

		it('should be project already running on node when true', function() {
			var waitReason = createNodeMock({
				maxExecutorsCount: 2,
				executors: {project1: 1}
			}).getExecutorWaitReason({
				name: 'project1'
			});
			expect(waitReason).eql('executor1: project already running on node');
		});

		it('should be blocked by project when blocked by executing', function() {
			var waitReason = createNodeMock({
				maxExecutorsCount: 2,
				executors: {project2: {project: {name: 'project2'}}}
			}).getExecutorWaitReason({
				name: 'project1',
				blockedBy: ['project2']
			});
			expect(waitReason).eql(
				'executor1: blocked by currently running "project2"'
			);
		});

		it('should be blocked by project when executing blocks it', function() {
			var waitReason = createNodeMock({
				maxExecutorsCount: 2,
				executors: {project2: {project: {
					name: 'project2',
					blocks: ['project1']
				}}}
			}).getExecutorWaitReason({
				name: 'project1'
			});
			expect(waitReason).eql(
				'executor1: blocked by currently running "project2"'
			);
		});

	});

	var expectNodeHasFreeExecutor = function(project, value) {
		it('should' + (value ? ' ' : ' not ') + 'has free executors for ' +
			project.name, function() {
				expect(node.hasFreeExecutor(project)).equal(value);
			}
		);
	};

	describe('basic', function() {
		it('instance should be created without errors', function() {
			node = createNode({
				type: 'local',
				maxExecutorsCount: 1
			});
		});

		expectNodeHasFreeExecutor(project1, true);
		expectNodeHasFreeExecutor(project2, true);
	});

	describe('with 100 ms project', function() {
		var originalCreateExecutor;
		before(function() {
			originalCreateExecutor = node._createExecutor;
			node._createExecutor = function() {
				return {run: function(params, callback) {
					setTimeout(callback, 100);
				}};
			};
		});

		it('should run without errors', function() {
			node.run(project1, {}, function(err) {
				expect(err).not.ok();
			});
		});

		expectNodeHasFreeExecutor(project1, false);
		expectNodeHasFreeExecutor(project2, false);

		it('wait for project done (should no errors)', function(done) {
			setTimeout(done, 100);
		});

		expectNodeHasFreeExecutor(project1, true);
		expectNodeHasFreeExecutor(project2, true);

		after(function() {
			node._createExecutor = originalCreateExecutor;
		});
	});
});
