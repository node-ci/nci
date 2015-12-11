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

		var expectedIds = [];
		var builds = _(2).chain().range().map(function(number) {
			expectedIds.push(number + 1);
			return makeBuild({project: {name: 'project' + number}});
		}).value();

		it('put two builds in parallel without errors', function(done) {
			Steppy(
				function() {
					var putGroup = this.makeGroup();
					_(builds).each(function(build) {
						db.builds.put(build, putGroup.slot());
					});
				},
				done
			);
		});

		it('shoud have ids ' + expectedIds.join(', '), function() {
			expect(_(builds).chain().pluck('id').sortBy().value()).eql(
				expectedIds
			);
		});

		after(function(done) {
			db.builds.del(expectedIds, done);
		});
	});

	describe('prallel builds put should produce different numbers', function() {

		var expectedIds = [];
		var builds = _(3).chain().range().map(function(number) {
			expectedIds.push(number + 1);
			return makeBuild({
				project: {name: 'project1'},
				status: 'in-progress'
			});
		}).value();

		it('put three builds in parallel without errors', function(done) {
			Steppy(
				function() {
					var putGroup = this.makeGroup();
					_(builds).each(function(build) {
						db.builds.put(build, putGroup.slot());
					});
				},
				done
			);
		});

		it('shoud have ids ' + expectedIds.join(', '), function() {
			expect(_(builds).chain().pluck('id').sortBy().value()).eql(
				expectedIds
			);
		});

		after(function(done) {
			db.builds.del(expectedIds, done);
		});
	});
});
