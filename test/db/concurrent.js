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
		Steppy(
			function() {
				db = helpers.initDb(this.slot());
			},
			function() {
				db.builds.find({}, this.slot());
			},
			function(err, builds) {
				if (builds.length) {
					db.builds.del(builds, this.slot());
				} else {
					this.pass(null);
				}
			},
			done
		);
	});

	describe('prallel builds add should produce different ids', function() {

		var expectedIds = [];
		var builds = _(100).chain().range().map(function(number) {
			expectedIds.push(number + 1);
			return makeBuild({project: {name: 'project' + number}});
		}).value();

		it('put builds in parallel without errors', function(done) {
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

		it('shoud have all ' + expectedIds.length +' ids ', function() {
			expect(_(builds).chain().pluck('id').sortBy().value()).eql(
				expectedIds
			);
		});

		after(function(done) {
			db.builds.del(expectedIds, done);
		});
	});

	describe('prallel builds add/update should produce different ids', function() {

		var expectedIds = [];
		var builds = _(200).chain().range().map(function(number) {
			expectedIds.push(number + 1);
			return makeBuild({project: {name: 'project' + number}});
		}).value();

		it('put builds in parallel without errors', function(done) {
			Steppy(
				function() {
					var putGroup = this.makeGroup();
					_(builds.slice(0, 190)).each(function(build) {
						db.builds.put(build, putGroup.slot());
					});
				},
				function() {
					var putGroup = this.makeGroup();
					_(builds).each(function(build) {
						db.builds.put(build, putGroup.slot());
					});
				},
				done
			);
		});

		it('shoud have all ' + expectedIds.length +' ids ', function() {
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
		var builds = _(100).chain().range().map(function(number) {
			expectedIds.push(number + 1);
			return makeBuild({
				project: {name: 'project1'},
				status: 'in-progress'
			});
		}).value();

		it('put builds in parallel without errors', function(done) {
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

		it('shoud have all ' + expectedIds.length +' ids ', function() {
			expect(_(builds).chain().pluck('id').sortBy().value()).eql(
				expectedIds
			);
		});

		after(function(done) {
			db.builds.del(expectedIds, done);
		});
	});
});
