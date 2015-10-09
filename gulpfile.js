'use strict';

var babelify = require('babelify');
var browserify = require('browserify');
var child = require('child_process');
var execSync = require('exec-sync')
var gulp = require('gulp');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var source = require('vinyl-source-stream');

var server;

gulp.task('package', function() {
  console.log(execSync('mvn package'));
});

gulp.task('run', ['package'], function() {
  if (server) {
    server.kill('SIGINT');
  }

  var target = execSync('ls target/*.jar');
  var deps = execSync('mvn dependency:build-classpath | grep -v INFO');
  server = child.spawn('java', [
      '-cp', target + ':' + deps, 'tdsql.Main', '"$*"'
  ]);

  server.stdout.on('data', function (data) {
    console.log('' + data);
  });

  server.stderr.on('data', function (data) {
    console.log('' + data);
  });

  server.on('close', function (code) {
    console.log('Server exited with code ' + code);
  });
});

gulp.task('js', function() {
  browserify({
    entries: 'src/main/resources/js/components/index.jsx',
    extensions: ['.jsx'],
    debug: true
  })
      .transform(babelify)
      .bundle()
      .pipe(source('bundle.js'))
      .pipe(gulp.dest('public/assets'));
});

gulp.task('sass', function() {
  gulp.src('src/main/resources/sass/**/*.scss', ['sass'])
      .pipe(sass().on('error', sass.logError))
      .pipe(rename('bundle.css'))
      .pipe(gulp.dest('public/assets'));
});

gulp.task('watch', function () {
  gulp.watch(
      ['src/main/java/**/*.java', 'src/main/resources/templates/**/*.jade'],
      ['package', 'run']);
  gulp.watch('src/main/resources/js/**/*.js', ['js']);
  gulp.watch('src/main/resources/sass/**/*.scss', ['sass']);
});

gulp.task('default', ['package', 'run', 'js', 'sass', 'watch']);