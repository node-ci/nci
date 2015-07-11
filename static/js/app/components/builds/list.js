'use strict';

define([
	'react',
	'reflux',
	'./item',
	'app/stores/builds',
	'templates/app/components/builds/list'
], function(React, Reflux, Item, buildsStore, template) {
	template = template.locals({
		Item: Item
	});

	var Component = React.createClass({
		mixins: [Reflux.ListenerMixin],
		componentDidMount: function() {
			this.listenTo(buildsStore, this.updateItems);
		},
		updateItems: function(items) {
			this.setState({items: items});
		},
		render: template,
		getInitialState: function() {
			return {
				items: []
			};
		}
	});

	return Component;
});
