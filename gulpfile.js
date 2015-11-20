var gulp = require('gulp');
var concat = require('gulp-concat');
var minify = require('gulp-minify');
var sass = require('gulp-sass');

gulp.task('build', function () {
	gulp.src('src/**/*.js')
		.pipe(concat('lens-multiplexer.js'))
		.pipe(minify())
		.pipe(gulp.dest('dist'));
});

gulp.task('sass', function () {
	gulp.src('./sass/main.scss')
		.pipe(sass().on('error', sass.logError))
		.pipe(gulp.dest('./css'));
})

gulp.task('default', ['build', 'sass'], function () {
	gulp.watch('src/**/*.js', ['build']);
	gulp.watch('./sass/**/*.scss', ['sass']);
});