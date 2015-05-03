'use strict';

define(['reflux'], function(Reflux) {
	var Actions = Reflux.createActions([
		'load',
		'readAll'
	]);

	return Actions;
});
