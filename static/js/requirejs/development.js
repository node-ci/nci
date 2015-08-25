
require.config({
	baseUrl: '/js',
	paths: {
		socketio: '/socket.io/socket.io',
		_dataio: '/data.io',
		underscore: 'libs/underscore/underscore',
		react: 'libs/react/react-with-addons',
		'react-router': 'libs/react-router/build/umd/ReactRouter',
		reflux: 'libs/reflux/dist/reflux',
		jquery: 'libs/jquery/jquery',
		ansi_up: 'libs/ansi_up/ansi_up',
		moment: 'libs/moment/moment',
		'bootstrap/collapse': 'libs/bootstrap/js/collapse',
		'bootstrap/dropdown': 'libs/bootstrap/js/dropdown'
	},
	shim: {
		'bootstrap/collapse': ['jquery'],
		'bootstrap/dropdown': ['jquery']
	}
});
