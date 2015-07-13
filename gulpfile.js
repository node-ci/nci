'use strict';

var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var less = require('gulp-less');
var gulpReactJade = require('gulp-react-jade-amd');
var mainBowerFiles = require('main-bower-files');

gulp.task('react-jade', function() {
	return gulp.src('static/js/**/*.jade')
		.pipe(gulpReactJade())
		.pipe(gulp.dest('static/js/templates'));
});

gulp.task('less', function () {
	return gulp.src('static/css/index.less')
		.pipe(less('index.css'))
		.pipe(gulp.dest('./static/css'));
});

gulp.task('fonts', function() {
	return gulp.src(mainBowerFiles({filter: /.*fonts.*/i}))
		.pipe(gulp.dest('static/fonts/'));
});

gulp.task('develop', function() {
	gulp.watch('static/js/app/**/*.jade', ['react-jade']);
	gulp.watch('static/css/**/*.less', ['less']);

	return nodemon({
		ignore: ['static/**/*.js', 'app/**/*.js', 'node_modules/**', 'data/**'],
		script: 'app.js',
		ext: 'js'
	});
});

gulp.task('default', [
	'react-jade',
	'less',
	'fonts',
	'develop'
]);
