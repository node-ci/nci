'use strict';

module.exports = function(data) {
	var builds = [{
		project: {
			name: 'foo'
		},
		start: Date.now(),
		step: 1,
		completed: false,
		status: 'inprogress'
	}];

	var resource = data.resource('builds');

	resource.use('readAll', function(req, res) {
		console.log('readAll');
		res.send(builds);
	});
};
