'use strict';

module.exports = function(app) {
	var builds = [{
		project: {
			name: 'foo'
		},
		start: Date.now(),
		step: 1,
		completed: false,
		status: 'inprogress'
	}];

	var resource = app.dataio.resource('builds');

	resource.use('readAll', function(req, res) {
		console.log('readAll');
		res.send(builds);
	});
};
