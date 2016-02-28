'use strict';

var createNode = require('../lib/node').createNode,
	expect = require('expect.js');


describe('Node', function() {
	var node,
		project1 = {name: 'project1'},
		project2 = {name: 'project2'};

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
