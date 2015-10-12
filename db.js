'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	nlevel = require('nlevel'),
	path = require('path'),
	utils = require('./lib/utils');


exports.init = function(dbPath, params, callback) {
	callback = _.after(2, callback);

	var maindbPath = path.join(dbPath, 'main'),
		mainDb = nlevel.db(maindbPath, params, callback);

	exports.builds = new nlevel.DocsSection(mainDb, 'builds', {
		projections: [
			{key: {createDate: 1}, value: pickId},
			{key: {descCreateDate: descCreateDate, id: 1}},
			{key: {
				projectName: pickProjectName,
				descCreateDate: descCreateDate,
				id: 1
			}},
			// note that's unordered projection (coz number is numeric),
			// it also contains only id
			{key: {
				projectName: pickProjectName,
				number: 1,
				id: 1
			}, value: pickId},
			{key: {
				projectName: pickProjectName,
				status: 1,
				descCreateDate: descCreateDate,
				id: 1
			}, value: function(build) {
				return _(build).pick('id', 'number', 'startDate', 'endDate');
			}}
		]
	});

	exports.builds.beforePut = function(builds, callback) {
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

	var buildLogsDbPath = path.join(dbPath, 'buildLogs'),
		buildLogsDb = nlevel.db(buildLogsDbPath, params, callback);

	exports.logLines = new nlevel.DocsSection(buildLogsDb, 'logLines', {
		projections: [
			{
				key: {
					buildId: 1,
					numberStr: function(logLine) {
						return utils.toNumberStr(logLine.number);
					}
				},
				value: function(logLine) {
					return _(logLine).pick('number', 'text');
				}
			}
		],
		withUniqueId: false
	});
};

/*
 * Introduce safe `beforePut` (instead of directly use `_beforePut`) for
 * id generation etc
 */
nlevel.DocsSection.prototype._beforePut = function(docs, callback) {
	var self = this;

	// Quit early if beforePut is not set
	if (!self.beforePut) {
		return callback();
	}

	Steppy(
		function() {
			if (self._beforePutInProgress) {
				return setTimeout(function() {
					nlevel.DocsSection.prototype._beforePut.call(
						self, docs, callback
					);
				}, 5);
			}

			self._beforePutInProgress = true;

			self.beforePut(docs, this.slot());
		},
		callback
	);
};

nlevel.DocsSection.prototype._afterPut = function(docs, callback) {
	this._beforePutInProgress = false;
	callback();
};

function pickProjectName(build) {
	return build.project.name;
}

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
