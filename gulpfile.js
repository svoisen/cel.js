const gulp = require('gulp');
const gutil = require('gulp-util');
const mocha = require('gulp-mocha');

gulp.task('default', function () {
    gulp.watch(['lib/**', 'test/**'], ['test']);
});

gulp.task('test', function () {
    return gulp.src(['test/*.js'], {read: false})
        .pipe(mocha({reporter: 'list'}))
        .on('error', gutil.log);
});
