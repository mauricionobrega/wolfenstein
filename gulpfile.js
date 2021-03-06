var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var less = require('gulp-less');
var minifyCSS = require('gulp-minify-css');
var gutil = require('gulp-util');
var rename = require('gulp-rename');
var filesize = require('gulp-filesize');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var handlebars = require('gulp-handlebars');
var defineModule = require('gulp-define-module');
var header = require('gulp-header');
var NwBuilder = require('node-webkit-builder');
var coveralls = require('gulp-coveralls');
var clean = require('gulp-clean');



var FINAL_NAME = 'wolfenstein';

// js package sources
var jsPackages = [
    './src/javascript/main/core/config/Properties.js',
    './src/javascript/main/core/utils/Helpful.js',
    './src/javascript/main/core/package/Manager.js',
    './src/javascript/main/core/config/Shortcut.js',
    './src/javascript/main/core/exceptions/*.js',
    './src/javascript/main/core/utils/*.js',
    './src/javascript/main/engine/**/*.js',
    './src/javascript/main/maps/**/*.js',
    './src/javascript/main/views/**/*.js',
    './src/javascript/main/start.js'
];


// template sources
var templates = [
    './src/javascript/main/templates/**/*.tmpl'
];


// js vendors sources
var jsVendors = [
    './src/javascript/main/vendors/handlebars.runtime.js'
];


// css sources
var cssPackage = [
    './src/stylesheet/main/less/settings.less',
    './src/stylesheet/main/less/common.less',
    './src/stylesheet/main/less/**/*.less'
];


// css vendors sources
var cssVendors = [
    './src/stylesheet/main/vendors/reset.css',
    './src/stylesheet/main/vendors/bootstrap.min.css'
];


// Generate the binary files for Linux or Windows
gulp.task('build', ['buildTemplates', 'buildJsVendors', 'buildJsSources', 'buidCssVendors', 'buildCssSources'], function () {
    var nw = new NwBuilder({
        version: '0.11.0',
        files: ['./package.json', './index.html', './build/**/*', './src/resources/**/*'],
        platforms: ['win32', 'win64', 'osx32', 'osx64', 'linux32', 'linux64'],
        buildDir: './bin'
    });

    // Log stuff you want
    nw.on('log', function (msg) {
        gutil.log('node-webkit-builder', msg);
    });

    // Build returns a promise, return it so the task isn't called in parallel
    return nw.build().catch(function (err) {
        gutil.log('node-webkit-builder', err);
    });
});


// concat all js files in order
gulp.task('buildJsSources', function() {
    return gulp.src(jsPackages)
        .pipe(jshint())
        .pipe(jshint.reporter(stylish))
        .pipe(concat(FINAL_NAME + '.js'))
        .pipe(gulp.dest('./build'))
        .pipe(uglify())
        .pipe(rename(FINAL_NAME + '.min.js'))
        .pipe(gulp.dest('./build'))
        .pipe(filesize())
        .on('error', gutil.log)
});


// concat all js vendors
gulp.task('buildJsVendors', function() {
    return gulp.src(jsVendors)
        .pipe(uglify())
        .pipe(concat(FINAL_NAME + '.vendors.min.js'))
        .pipe(gulp.dest('./build'))
        .pipe(filesize())
        .on('error', gutil.log)
});


// generate all templates
gulp.task('buildTemplates', function() {
    return gulp.src(templates)
        .pipe(handlebars())
        .pipe(defineModule('plain', {
            wrapper: 'App.template["<%= templateName %>"] = <%= handlebars %>',
            context: function(context) {
                var file = context.file;
                var fullPath = file.path;
                var tplPath = fullPath.split("javascript/main/templates/").pop();

                var find = '/';
                var regex = new RegExp(find, 'g');

                var name = tplPath.replace(regex, '.').replace('.js', '');

                return { templateName: name };
            }
        }))
        .pipe(concat(FINAL_NAME + '.templates.min.js'))
        .pipe(header('var App = App || {}; App.template = App.template || {};'))
        .pipe(uglify())
        .pipe(gulp.dest('./build'))
        .pipe(filesize())
        .on('error', gutil.log);
});


// concat all css sources.
gulp.task('buildCssSources', function() {
    return gulp.src(cssPackage)
        .pipe(concat(FINAL_NAME + '.css'))
        .pipe(less())
        .pipe(gulp.dest('./build'))
        .pipe(filesize())
        .pipe(minifyCSS())
        .pipe(rename(FINAL_NAME + '.min.css'))
        .pipe(gulp.dest('./build'))
        .pipe(filesize())
        .on('error', gutil.log)
});


// concat all css vendors
gulp.task('buidCssVendors', function() {
    return gulp.src(cssVendors)
        .pipe(concat(FINAL_NAME + '.vendors.css'))
        .pipe(gulp.dest('./build'))
        .pipe(filesize())
        .on('error', gutil.log)
});


// watch the modifications and re-build.
gulp.task('watch', function() {
    gulp.watch(jsPackages, ['buildJsSources']);
    gulp.watch(jsVendors, ['buildJsVendors']);
    gulp.watch(templates, ['buildTemplates']);
    gulp.watch(cssVendors, ['buidCssVendors']);
    gulp.watch(cssPackage, ['buildCssSources']);
});


// Coverage
gulp.task('coveralls', ['sendToCoveralls'], function() {
    return gulp.src('src/javascript/tests/coverage/', {read: false})
        .pipe(clean());
});


gulp.task('sendToCoveralls', function() {
    return gulp.src('src/javascript/tests/coverage/**/lcov.info')
        .pipe(coveralls());
});


// Prepare to tests
gulp.task('prepare', [
    'buildTemplates',
    'buildJsVendors',
    'buildJsSources',
    'buidCssVendors',
    'buildCssSources'
]);


// default Task
gulp.task('default', [
    'buildTemplates',
    'buildJsVendors',
    'buildJsSources',
    'buidCssVendors',
    'buildCssSources',
    'watch'
]);

