'use strict';

require.config({
	baseUrl: '/js/',
	paths: {
		underscore: 'libs/underscore/underscore',
		react: 'libs/react/react-with-addons',
		'react-router': 'libs/react-router/build/umd/ReactRouter',
		reflux: 'libs/reflux/dist/reflux',
		_dataio: '/data.io',
		socketio: '/socket.io/socket.io.js',
		jquery: 'libs/jquery/jquery',
		ansi_up: 'libs/ansi_up/ansi_up',
		'bootstrap/collapse': 'libs/bootstrap/js/collapse',
		'bootstrap/dropdown': 'libs/bootstrap/js/dropdown'
	},
	shim: {
		'bootstrap/collapse': ['jquery'],
		'bootstrap/dropdown': ['jquery']
	}
});
