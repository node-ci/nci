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
		{key: {project: 1, descCreateDate: descCreateDate, id: 1}}
	]
});

exports.builds._beforePut = function(docs, callback) {
	generateIds(this, docs, callback);
};

function generateIds(section, docs, callback) {
	Steppy(
		function() {
			if (isAllDocsWithId(docs)) {
				return callback();
			}

			var mixedIdsError = checkForMixedIds(docs);
			if (mixedIdsError) throw mixedIdsError;

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

function isAllDocsWithId(docs) {
	return _(docs).all(function(doc) {
		return 'id' in doc;
	});
}

function checkForMixedIds(docs) {
	var isAllWithoutId = _(docs).all(function(doc) {
		return 'id' in doc === false;
	});
	if (!isAllWithoutId) {
		return new Error(
			'Documents with id and without should not be mixed'
		);
	}
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
