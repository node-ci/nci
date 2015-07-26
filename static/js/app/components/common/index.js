'use strict';

define([
	'./dateTime/index',
	'./scm/index',
	'./duration/index',
	'./progress/index'
], function(DateTime, Scm, Duration, Progress) {
	return {
		DateTime: DateTime,
		Scm: Scm,
		Duration: Duration,
		Progress: Progress
	};
});
