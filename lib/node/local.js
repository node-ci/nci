'use strict';

var inherits = require('util').inherits,
	ParentNode = require('./base').Node,
	LocalExecutor = require('../executor/local').Executor,
	_ = require('underscore');

function Node(params) {
	ParentNode.call(this, params);
}

inherits(Node, ParentNode);

exports.Node = Node;

Node.prototype._createExecutor = function(params) {
	return new LocalExecutor(_({type: this.type}).defaults(params));
};
