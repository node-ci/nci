'use strict';

define([
	'app/components/builds/item',
	'app/components/builds/list',
	'app/components/builds/view'
], function(Item, List, View) {
	return {
		Item: Item,
		List: List,
		View: View
	};
});
