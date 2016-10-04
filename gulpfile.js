'use strict';

const browserify = require('browserify');
const buffer = require('vinyl-buffer');
const gulp = require('gulp');
const gutil = require('gulp-util');
const mocha = require('gulp-mocha');
const source = require('vinyl-source-stream');
const rename = require('gulp-rename');

var config = {
    js: {
        entry: './lib/main.js',
        outputDir: './dist/',
        outputFile: 'cel.js'
    }
};

gulp.task('default', function () {
    gulp.watch(['lib/**', 'test/**'], ['test', 'build']);
});

gulp.task('build', function () {
    browserify(config.js.entry)
        .bundle()
        .pipe(source(config.js.entry))
        .pipe(buffer())
        .pipe(rename(config.js.outputFile))
        .pipe(gulp.dest(config.js.outputDir));
});

gulp.task('test', function () {
    gulp.src(['test/*.js'], {read: false})
        .pipe(mocha({reporter: 'spec'}))
        .on('error', gutil.log);
});
