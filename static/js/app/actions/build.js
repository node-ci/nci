'use strict';

define(['reflux'], function(Reflux) {
	var Actions = Reflux.createActions([
		'cancel',
		'readTerminalOutput',
		'readAll',
		'read'
	]);

	return Actions;
});
