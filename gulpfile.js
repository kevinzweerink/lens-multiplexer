var gulp = require('gulp');
var concat = require('gulp-concat');
var minify = require('gulp-minify');

gulp.task('build', function () {
	gulp.src('src/**/*.js')
		.pipe(concat('lens-multiplexer.js'))
		.pipe(minify())
		.pipe(gulp.dest('dist'));
});

gulp.task('default', ['build'], function () {
	gulp.watch('src/**/*.js', ['build']);
});