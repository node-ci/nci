'use strict';

var Distributor = require('../lib/distributor').Distributor,
	Node = require('../lib/node').Node,
	expect = require('expect.js');


describe('Distributor', function() {
	var distributor,
		project1 = {name: 'project1'};

	describe('with sucess project', function() {
		var originalCreateNode,
			originalUpdateBuild;

		before(function() {
			originalCreateNode = Distributor.prototype._createNode;
			Distributor.prototype._createNode = function(params) {
				var node = new Node(params);
				node._createExecutor = function() {
					return {run: function(params, callback) {
						setTimeout(callback, 100);
					}};
				};
				return node;
			};

			originalUpdateBuild = Distributor.prototype._updateBuild;

			var updateBuildNumber = 1;
			Distributor.prototype._updateBuild = function(build, callback) {
				if (updateBuildNumber === 1) {
					expect(distributor.queue).length(0);
					expect(build.status).equal('waiting');
				} else if (updateBuildNumber === 2) {
					expect(distributor.queue).length(1);
					expect(build.status).equal('in-progress');
				} else if (updateBuildNumber === 3) {
					expect(distributor.queue).length(0);
					expect(build.status).equal('done');
				} else {
					throw new Error('Should never happend');
				}
				updateBuildNumber++;
				callback(null, build)
			};
		});

		it('instance should be created without errors', function() {
			distributor = new Distributor({
				nodes: [{type: 'local', maxExecutorsCount: 1}]
			});
		});

		it('should run without errors', function() {
			distributor.run(project1, {}, function(err) {
				expect(err).not.ok();
			});
		});

		it('wait for project done (should no errors)', function(done) {
			setTimeout(done, 100);
		});

		after(function() {
			Distributor.prototype._createNode = originalCreateNode;
			Distributor.prototype._updateBuild = originalUpdateBuild;
		});
	});
});
