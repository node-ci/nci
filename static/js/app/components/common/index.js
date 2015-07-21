'use strict';

define([
	'./dateTime/index',
	'./scm/index',
	'./duration/index'
], function(DateTime, Scm, Duration) {
	return {
		DateTime: DateTime,
		Scm: Scm,
		Duration: Duration
	};
});
