
({
	mainConfigFile: 'development.js',
	baseUrl: '../',
	paths: {
		socketio: (
			'../../node_modules/socket.io/node_modules/' +
			'socket.io-client/socket.io'
		),
		_dataio: '../../node_modules/data.io/data.io',
	},
	name: 'app/app',
	preserveLicenseComments: false,
	optimize: 'uglify2',
	useStrict: true,
	out: '../../js/app.build.js'
});
