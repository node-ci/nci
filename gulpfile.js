'use strict';

var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var gulpReactJade = require('gulp-react-jade-amd');

gulp.task('react-jade', function() {
	return gulp.src('static/js/**/*.jade')
		.pipe(gulpReactJade())
		.pipe(gulp.dest('static/js/templates'));
});

gulp.task('develop', function() {
	gulp.watch('static/js/app/**/*.jade', ['react-jade']);
	//gulp.watch('static/css/**/*.less', ['make-styles']);

	return nodemon({
		ignore: ['static/**/*.js', 'app/**/*.js', 'node_modules/**'],
		script: 'app.js',
		ext: 'js'
	});
});

gulp.task('default', [
	'react-jade',
	'develop'
]);
