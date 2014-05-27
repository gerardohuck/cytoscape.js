var gulp = require('gulp');
var path = require('path');
var tap = require('gulp-tap');
var clean = require('gulp-clean');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var replace = require('gulp-replace');
var inject = require('gulp-inject');
var zip = require('gulp-zip');
var mocha = require('gulp-mocha');
var child_process = require('child_process');
var fs = require('fs');
var htmlmin = require('gulp-htmlmin');
var cssmin = require('gulp-cssmin');
var shell = require('gulp-shell');
var jshint = require('gulp-jshint');
var jshStylish = require('jshint-stylish');

var now = new Date();
var version = process.env['VERSION'] || ['snapshot', +now].join('-');

var paths = {
  sources: [
    'src/preamble.js',
    'src/namespace.js', 
    'src/is.js', 
    'src/util.js', 
    'src/math.js', 
    'src/instance-registration.js', 
    'src/extension.js',
    'src/jquery-plugin.js',
    'src/event.js',
    'src/define.js',
    'src/selector.js',
    'src/style.js',
    'src/style-*.js',
    'src/core.js',
    'src/core-*.js',
    'src/collection.js',
    'src/collection-*.js',
    'src/heap.js',
    'src/extensions/renderer.canvas.define-and-init-etc.js',
    'src/extensions/renderer.canvas.*.js',
    'src/extensions/*.js'
  ],

  docs: {
    js: [
      'documentation/js/fastclick.js',
      'documentation/js/jquery.js',
      'documentation/js/cytoscape.js',
      'documentation/js/load.js',
      'documentation/js/script.js'
    ],

    css: [
      'documentation/css/reset.css',
      'documentation/css/font-awesome.css',
      'documentation/css/highlight/github.css',
      'documentation/css/style.css'
    ]
  }
};


gulp.task('default', ['build'], function(){
  
});

gulp.task('version', function(){
  console.log('Using version number `%s` for building', version);
});

gulp.task('clean', function(){
  return gulp.src(['build'])
    .pipe( clean({ read: false }) )
  ;
});

gulp.task('concat', function(){
  return gulp.src( paths.sources )
    .pipe( replace('{{VERSION}}', version) )
    
    .pipe( concat('cytoscape.js') )
    
    .pipe( gulp.dest('build') )
  ;
});

gulp.task('build', function(){
  return gulp.src( paths.sources )
    .pipe( replace('{{VERSION}}', version) )
    
    .pipe( concat('cytoscape.js') )
    
    .pipe( gulp.dest('build') )
    
    .pipe( uglify({
      mangle: true,

      preserveComments: 'some'
    }) )

    .pipe( concat('cytoscape.min.js') )
    
    .pipe( gulp.dest('build') )
  ;
});

gulp.task('debugrefs', function(){
  return gulp.src('debug/index.html')
    .pipe( inject( gulp.src(paths.sources, { read: false }), {
      addPrefix: '..',
      addRootSlash: false
    } ) )

    .pipe( gulp.dest('debug') )
  ;
});

gulp.task('testrefs', function(){
  return gulp.src('test/index.html')
    .pipe( inject( gulp.src(paths.sources, { read: false }), {
      addPrefix: '..',
      addRootSlash: false
    } ) )

    .pipe( gulp.dest('test') )
  ;
});

gulp.task('testlist', function(){
  return gulp.src('test/index.html')
    .pipe( inject( gulp.src('test/*.js', { read: false }), {
      addPrefix: '',
      ignorePath: 'test',
      addRootSlash: false,
      starttag: '<!-- inject:test:{{ext}} -->'
    } ) )

    .pipe( gulp.dest('test') )
  ;
});

gulp.task('refs', ['debugrefs', 'testrefs', 'testlist'], function(next){
  next();
});

gulp.task('zip', ['build'], function(){
  return gulp.src(['build/cytoscape.js', 'build/cytoscape.min.js', 'LGPL-LICENSE.txt', 'lib/arbor.js'])
    .pipe( zip('cytoscape.js-' + version + '.zip') )

    .pipe( gulp.dest('build') )
  ;
});

gulp.task('test', ['concat'], function(){
  return gulp.src('test/*.js')
    .pipe( mocha({
      reporter: 'spec'
    }) )
  ;
});

gulp.task('docsver', function(){
  return gulp.src('documentation/docmaker.json')
    .pipe( replace(/\"version\"\:\s*\".*?\"/, '"version": "' + version + '"') )

    .pipe( gulp.dest('documentation') )
  ;
});

gulp.task('docsjs', ['build'], function(){
  return gulp.src([
    'build/cytoscape.js',
    'build/cytoscape.min.js',
    'lib/arbor.js'
  ])
    .pipe( gulp.dest('documentation/js') )

    .pipe( gulp.dest('documentation/api/cytoscape.js-' + version) )

    .pipe( gulp.dest('documentation/api/cytoscape.js-latest') )
  ;
});

gulp.task('docsdl', ['zip'], function(){
  return gulp.src('build/cytoscape.js-' + version + '.zip')
    .pipe( gulp.dest('documentation/download') )
  ;
});

gulp.task('docs', function(next){
  var cwd = process.cwd();

  process.chdir('./documentation');
  require('./documentation/docmaker');
  process.chdir( cwd );

  next();
});

gulp.task('docsmin', ['docshtmlmin'], function(next){
  next();
});

gulp.task('docsclean', function(next){
  return gulp.src(['documentation/js/all.min.js', 'documentation/css/all.min.css', 'documentation/index.html'])
    .pipe( clean({ read: false }) )
  ;
});

gulp.task('docshtmlmin', ['docsminrefs'], function(){
  return gulp.src('documentation/index.html')
    .pipe( htmlmin({
      collapseWhitespace: false,
      keepClosingSlash: true
    }) )

    .pipe( gulp.dest('documentation') )
  ;
});

gulp.task('docsjsmin', ['docs'], function(){
  return gulp.src( paths.docs.js )
    .pipe( concat('all.min.js') )
    
    .pipe( uglify({
      mangle: true
    }) )

    .pipe( gulp.dest('documentation/js') )
  ;
});

gulp.task('docscssmin', ['docs'], function(){ 
  return gulp.src( paths.docs.css )
    .pipe( concat('all.min.css') )

    .pipe( cssmin() )

    .pipe( gulp.dest('documentation/css') )
  ;
});

gulp.task('docsminrefs', ['docscssmin', 'docsjsmin'], function(){
  return gulp.src('documentation/index.html')
    .pipe( inject( gulp.src([ 'documentation/js/all.min.js', 'documentation/css/all.min.css' ], { read: false }), {
      addRootSlash: false,
      ignorePath: 'documentation'
    } ) )

    .pipe( gulp.dest('documentation') )
  ;
});

gulp.task('docsrefs', function(){
  return gulp.src([ 'documentation/index.html', 'documentation/template.html' ])
    .pipe( inject( gulp.src(paths.docs.js.concat( paths.docs.css ), { read: false }), {
      addRootSlash: false,
      ignorePath: 'documentation'
    } ) )

    .pipe( gulp.dest('documentation') )
  ;
});

gulp.task('docspub', ['docsver', 'docsjs', 'docsdl'], function(){
  return gulp.start('docsmin');
});

gulp.task('pkgver', function(){
  return gulp.src([
    'package.json',
    'bower.json'
  ])
    .pipe( replace(/\"version\"\:\s*\".*?\"/, '"version": "' + version + '"') )

    .pipe( gulp.dest('./') )
  ;
});

gulp.task('dist', ['build'], function(){
  return gulp.src([
    'build/cytoscape.js',
    'build/cytoscape.min.js',
    'build/arbor.js'
  ])
    .pipe( gulp.dest('dist') )
  ;
});

gulp.task('pub', ['pkgver', 'dist', 'docspub'], function(next){
  next();
});

gulp.task('tag', shell.task([
  './publish-tag.sh'
]));

gulp.task('docspush', shell.task([
  './publish-docs.sh'
]));

gulp.task('npm', shell.task([
  './publish-npm.sh'
]));

gulp.task('watch', function(next){
  var watcher = gulp.watch(paths.sources, ['testrefs','debugrefs']);
  watcher.on('added deleted', function(event){
    console.log('File ' + event.path + ' was ' + event.type + ', updating lib refs in pages...');
  });

  var testWatcher = gulp.watch('test/*.js', ['testlist']);
  testWatcher.on('added deleted', function(event){
    console.log('File ' + event.path + ' was ' + event.type + ', updating test refs in pages...');
  });

  next();
});

gulp.task('lint', function(){
  return gulp.src( paths.sources )
    .pipe( jshint({
      funcscope: true,
      laxbreak: true,
      loopfunc: true,
      strict: true,
      unused: 'vars',
      eqnull: true,
      sub: true,
      shadow: true
    }) )

    .pipe( jshint.reporter(jshStylish) )
  ;
});