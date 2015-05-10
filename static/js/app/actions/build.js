'use strict';

define(['reflux'], function(Reflux) {
	var Actions = Reflux.createActions([
		'readTerminalOutput',
		'readAll'
	]);

	return Actions;
});
