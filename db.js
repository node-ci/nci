'use strict';

var Steppy = require('twostep').Steppy,
	_ = require('underscore'),
	nlevel = require('nlevel'),
	path = require('path'),
	utils = require('./lib/utils'),
	through = require('through');


exports.init = function(dbPath, params, callback) {
	callback = _.after(2, callback);

	var maindbPath = path.join(dbPath, 'main'),
		mainDb = nlevel.db(maindbPath, _({
			valueEncoding: 'json'
		}).defaults(params), callback);

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
				// quit if we already have ids and numbers
				if (_(builds).all(function(build) {
					return build.id && build.number;
				})) {
					return callback();
				}

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

	// custom optimized emplementation for storing log lines
	exports.logLines = {};

	exports.logLines.separator = '~';
	exports.logLines.end = '\xff';

	exports.logLines._getStrKey = function(line) {
		return line.buildId + this.separator + (
			_(line).has('number') ? utils.toNumberStr(line.number) : ''
		);
	};

	exports.logLines._parseData = function(data) {
		var keyParts = data.key.split(this.separator),
			buildId = Number(keyParts[0]),
			number = Number(keyParts[1]);

		return {buildId: buildId, number: number, text: data.value};
	};

	exports.logLines.put = function(lines, callback) {
		var self = this;
		lines = _(lines).isArray() ? lines : [lines];

		var operations = _(lines).map(function(line) {
			return {
				type: 'put',
				key: self._getStrKey(line),
				value: line.text
			};
		});

		buildLogsDb.batch(operations, callback);
	};

	exports.logLines.createReadStream = function(params) {
		var self = this;
		if (!params.start && params.end) {
			new Error('`end` selected without `start`');
		}

		params.start = self._getStrKey(params.start);
		params.end = params.end ? self._getStrKey(params.end) : params.start;
		// add end character
		params.end += self.end;
		// swap `start` `end` conditions when reverse is set
		if (params.reverse) {
			var prevStart = params.start;
			params.start = params.end;
			params.end = prevStart;
		}

		var resultStream = through(function(data) {
			this.emit('data', _(data).isObject() ? self._parseData(data) : data);
		});

		return buildLogsDb.createReadStream(params)
			.on('error', function(err) {
				resultStream.emit('error', err);
			})
			.pipe(resultStream)
	};

	exports.logLines.find = function(params, callback) {
		var self = this;
		callback = _(callback).once();

		var lines = [];
		self.createReadStream(params)
			.on('error', callback)
			.on('data', function(line) {
				lines.push(line);
			})
			.on('end', function() {
				callback(null, lines);
			})
	};

	exports.logLines.remove = function(params, callback) {
		var self = this;
		callback = _(callback).once();

		var operations = [];
		self.createReadStream(_({values: false}).extend(params))
			.on('error', callback)
			.on('data', function(key) {
				operations.push({type: 'del', key: key});
			})
			.on('end', function() {
				buildLogsDb.batch(operations, callback);
			});
	};
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

	if (self._beforePutInProgress) {
		setTimeout(function() {
			nlevel.DocsSection.prototype._beforePut.call(
				self, docs, callback
			);
		}, 1);
	} else {
		self._beforePutInProgress = true;

		// update createDate before put to provide latest date for last id
		// it's rquired for correct generateIds function
		_(docs).each(function(doc) {
			if (!doc.id) {
				doc.createDate = Date.now();
			}
		});

		self.beforePut(docs, callback);
	}
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
