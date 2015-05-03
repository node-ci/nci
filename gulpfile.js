'use strict';

var gulp = require('gulp');
var gulpReactJade = require('gulp-react-jade-amd');

gulp.task('react-jade', function() {
	return gulp.src('static/js/**/*.jade')
		.pipe(gulpReactJade())
		.pipe(gulp.dest('static/js/templates'));
});
