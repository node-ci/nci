'use strict';

var conn = data(io.connect());
var builds = conn.resource('builds');

console.log(builds);

builds.sync('readAll', function(err, result) {
	console.log(result);
});
