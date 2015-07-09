'use strict';

define(['reflux'], function(Reflux) {
	var Actions = Reflux.createActions([
		'run',
		'readAll',
		'read'
	]);

	return Actions;
});
