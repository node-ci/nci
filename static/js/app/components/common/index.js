'use strict';

define([
	'./dateTime/index',
	'./scm/index'
], function(DateTime, Scm) {
	return {
		DateTime: DateTime,
		Scm: Scm
	};
});
