'use strict';

define(['reflux'], function(Reflux) {
	var Actions = Reflux.createActions([
		'readConsoleOutput',
		'readAll'
	]);

	return Actions;
});
