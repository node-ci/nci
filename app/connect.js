'use strict';

var socketio = require('socket.io-client'),
	dataio = require('data.io/data.io'), 
	io = socketio(),
	data = dataio(io);

module.exports.io = io;
module.exports.data = data;
