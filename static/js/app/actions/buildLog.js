'use strict';

define(['reflux'], function(Reflux) {
	var Actions = Reflux.createActions([
		'getTail',
		'getLines'
	]);

	return Actions;
});
