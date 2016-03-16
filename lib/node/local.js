'user strict';

var inherits = require('util').inherits,
	ParentNode = require('./base').Node,
	LocalExecutor = require('../executor/local').Executor;

function Node(params) {
	ParentNode.call(this, params);
}

inherits(Node, ParentNode);

exports.Node = Node;

Node.prototype._createExecutor = function(project) {
	return new LocalExecutor({
		type: this.type,
		project: project
	});
};
