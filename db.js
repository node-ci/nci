'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	nlevel = require('nlevel'),
	ldb = nlevel.db('path/to/db/ignored/for/memdown', {
		db: require('memdown'),
		valueEncoding: 'json'
	});

exports.builds = new nlevel.DocsSection(ldb, 'builds', {
	projections: [
		{key: {createDate: 1}, value: pickId},
		{key: {descCreateDate: descCreateDate, id: 1}},
		{key: {
			projectName: function(build) {
				return build.project.name;
			},
			descCreateDate: descCreateDate,
			id: 1
		}}
	]
});

exports.builds._beforePut = function(builds, callback) {
	var self = this,
		build;

	Steppy(
		function() {
			if (builds.length > 1) {
				throw new Error('Build put hooks work only with single build');
			}
			build = builds[0];

			// generate number for build
			if (!build.number && build.status === 'in-progress') {
				// find last build with number in the same project
				self.find({
					start: {projectName: build.project.name, descCreateDate: ''},
					filter: function(build) {
						return 'number' in build;
					},
					limit: 1
				}, this.slot());
			} else {
				this.pass([]);
			}

			generateIds(self, builds, this.slot());
		},
		function(err, prevBuilds) {
			var prevBuild = prevBuilds[0];
			if (!build.number && build.status === 'in-progress') {
				build.number = prevBuild ? prevBuild.number + 1 : 1;
			}

			this.pass(null);
		},
		callback
	);
};

function generateIds(section, docs, callback) {
	Steppy(
		function() {
			var isAllDocsWithId = _(docs).all(function(doc) {
				return 'id' in doc;
			});
			if (isAllDocsWithId) {
				return callback();
			}

			var isAllDocsWithoutId = _(docs).all(function(doc) {
				return 'id' in doc === false;
			});
			if (!isAllDocsWithoutId) {
				throw new Error(
					'Documents with id and without should not be mixed'
				);
			}

			section.find({
				start: {createDate: ''}, limit: 1, reverse: true
			}, this.slot());
		},
		function(err, lastDocs) {
			var id = lastDocs[0] && ++lastDocs[0].id || 1;

			_(docs).each(function(doc) {
				doc.id = id;
				id++;
			});

			this.pass(null);
		},
		callback
	);
}

function pickId(doc) {
	return {id: doc.id};
}

// reversed date - for sorting forward (it's fatster for leveldb then
// reverse: true, see levelup reverse notes for details) but have documents
// sorted by some date in descending order
var maxTime = new Date('03:14:07 UTC 2138-01-19').getTime();

function descCreateDate(doc) {
	return maxTime - doc.createDate;
}
