'use strict';

module.exports = function(app) {
	var resource = app.dataio.resource('builds');

	return resource;
};
