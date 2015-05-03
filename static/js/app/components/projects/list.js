'use strict';

define([
	'react',
	'reflux',
	'./item', 
	'app/stores/project',
	'templates/app/components/projects/list'
], function(React, Reflux, Item, projectStore, template) {
	var Component = React.createClass({
		mixins: [Reflux.ListenerMixin],
		componentDidMount: function() {
			this.listenTo(projectStore, this.updateItems);
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
