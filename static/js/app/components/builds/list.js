'use strict';

define([
	'react',
	'reflux',
	'./item',
	'app/stores/builds',
	'templates/app/components/builds/list'
], function(React, Reflux, Item, buildsStore, template) {
	var Component = React.createClass({
		mixins: [Reflux.ListenerMixin],
		componentDidMount: function() {
			this.listenTo(buildsStore, this.updateItems);
		},
		updateItems: function(items) {
			this.setState({items: items});
		},
		render: function() {
			return template({
				Item: Item,
				items: this.state.items
			});
		},
		getInitialState: function() {
			return {
				items: []
			};
		}
	});

	return Component;
});
