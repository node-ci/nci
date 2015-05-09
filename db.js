'use strict';

var nlevel = require('nlevel'),
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

exports.builds.idGenerator = getNextId;

// TODO: move to nlevel
var superPut = nlevel.DocsSection.prototype.put;
nlevel.DocsSection.prototype.put = function(docs, callback) {
	var self = this;
	if (!Array.isArray(docs)) docs = [docs];
	if (this.idGenerator && docs[0] && 'id' in docs[0] === false) {
		if (docs.every(function(doc) { return 'id' in doc === false; })) {
			this.idGenerator(function(err, id) {
				if (err) return callback(err);
				docs.forEach(function(doc) {
					doc.id = id;
					id++;
				});
				superPut.call(self, docs, callback);
			});
		} else {
			return callback(new Error(
				'Documents with id and without should not be ' +
				'mixed on put when id generator is set'
			));
		}
	} else {
		return superPut.call(this, docs, callback);
	}
};

function getNextId(callback) {
	this.find({
		start: {createDate: ''}, limit: 1, reverse: true
	}, function(err, docs) {
		callback(err, !err && docs[0] && ++docs[0].id || 1);
	});
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
