'use strict';

var expect = require('expect.js'),
	helpers = require('./helpers');

describe('App', function() {
	var App;

	it('module should export constructor', function() {
		App = helpers.requireApp();
		expect(App).a('function');
	});

	var app;

	it('should be created without errors', function() {
		app = new App();
	});

	it('should have init method', function() {
		expect(app.init).a('function');
	});

	it('should have listen method', function() {
		expect(app.listen).a('function');
	});

	it('should init without errors', function(done) {
		app.init(done);
	});
});
