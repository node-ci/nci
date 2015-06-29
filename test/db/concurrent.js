'use strict';

var expect = require('expect.js'),
	helpers = require('../helpers'),
	Steppy = require('twostep').Steppy,
	_ = require('underscore');

describe('Db concurrency', function() {

	var db;

	var madeBuildIndex = 0;
	var makeBuild = function(build) {
		return _({
			// to increase build numbers
			createDate: Date.now() + madeBuildIndex++,
			project: _({}).extend(build && build.project)
		}).extend(build);
	};

	before(function(done) {
		db = helpers.initDb(done);
	});

	describe('prallel builds put should produce different ids', function() {

		var firstBuild = makeBuild({project: {name: 'project1'}}),
			secondBuild = makeBuild({project: {name: 'project2'}});

		it('put two builds in parallel without errors', function(done) {
			Steppy(
				function() {
					db.builds.put(firstBuild, this.slot());
					db.builds.put(secondBuild, this.slot());
				},
				done
			);
		});

		it('first build should have id 1', function() {
			expect(firstBuild.id).equal(1);
		});

		it('secondBuild build should have id 2', function() {
			expect(secondBuild.id).equal(2);
		});

	});

	describe('prallel builds put should produce different numbers', function() {

		var builds = _(3).chain().range().map(function() {
			return makeBuild({
				project: {name: 'project1'},
				status: 'in-progress'
			});
		}).value();

		it('put three builds in parallel without errors', function(done) {
			Steppy(
				function() {
					var step = this;
					_(builds).each(function(build) {
						db.builds.put(build, step.slot());
					});
				},
				done
			);
		});

		_(builds).each(function(build, index) {
			var number = (index + 1);
			it('build ' + number + ' should have number ' + number, function() {
				expect(build.number).equal(number);
			});
		});

	});
});
