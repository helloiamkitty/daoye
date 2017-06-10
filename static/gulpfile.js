var gulp = require('gulp');
var sass = require('gulp-sass');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var concat = require('gulp-concat');
var del = require('del');
var fs = require('fs');
var Path = require('path');
var handlebars = require('gulp-handlebars');
var wrap = require('gulp-wrap');
var declare = require('gulp-declare');
var uglify = require('gulp-uglify');
var gulpUtil = require('gulp-util');
var htmlmin = require('gulp-htmlmin');
var minifyCSS = require('gulp-minify-css');
var rev = require('gulp-rev');
var revCollector = require('gulp-rev-collector');
var rename = require('gulp-rename');
var replaceSsi = require('./gulp-plugins/gulp-replace-ssi.js');

var paths = {
    src: {
        assets: 'assets/**/*',
        sass: 'scss/**/*.scss',
        jsDir: 'js/',
        jsFiles: 'js/**/*.*',
        extendDir: 'js/extend/',
        coreDir: 'js/core/',
        extendFiles: 'js/extend/*.js',
        coreFiles: 'js/core/*.js',
        pageFiles: 'js/*.js',
        html: 'html/**/*.html',
        image: 'image/**/*',
        favicon: 'favicon.ico',
        ckplayer: 'ckplayer/**/*'
    },

    build: {
        dir: 'build/',
        cssDir: 'build/css/',
        jsDir: 'build/js/',
        jsFiles: 'build/js/**/*.js',
        cssFiles: 'build/css/*.css'
    },

    dev: {
        dir: 'dev/',
        htmlDir: 'dev/',
        jsDir: 'dev/js/',
        cssDir: 'dev/css/',
        image: 'dev/image/',
        assets: 'dev/assets/',
        ckplayer: 'dev/ckplayer/'
    },

    dist: {
        dir: 'dist/',
        htmlDir: 'dist',
        jsDir: 'dist/js/',
        cssDir: 'dist/css/',
        jsRev: 'dist/rev/js',
        cssRev: 'dist/rev/css',
        image: 'dist/image/',
        assets: 'dist/assets/',
        ckplayer: 'dist/ckplayer/'
    },

    rev: {
        assets: [
            'dist/css/*.css',
            'dist/js/**/*.js',
            'dist/image/**/*'
        ],
        base: 'dist/',
        manifest: {
            name: 'manifest.json',
            path: 'dist/rev'
        },
        collect: {
            src: [
                'dist/rev/manifest.json',
                'dist/**/*.{html,css,js}',
                '!dist/favicon.ico'
            ],
            dist: 'dist/'
        }
    }
};

gulp.task('watch', function (cb) {
    gulp.watch(paths.src.sass, ['dev-css']);
    gulp.watch([paths.src.jsFiles], ['dev-js']);
    gulp.watch(paths.src.html, ['dev-html']);
    gulp.watch(paths.src.image, ['dev-image']);
    gulp.watch(paths.src.favicon, ['dev-favicon']);

    cb();
});

gulp.task('clean-build', function (cb) {
    del.sync(paths.build.dir);
    cb();
});

gulp.task('sass', function () {
    var processors = [autoprefixer];
    return gulp.src(paths.src.sass)
        .pipe(sass({errLogToConsole: true}))
        .pipe(postcss(processors))
        .pipe(gulp.dest(paths.build.cssDir));
});

gulp.task('script-core', function () {
    return gulp.src(paths.src.coreFiles)
        .pipe(concat('core.js'))
        .pipe(gulp.dest(paths.build.jsDir));  
});

gulp.task('script-extend', function () {
    return gulp.src(paths.src.extendFiles)
        .pipe(concat('extend.js'))
        .pipe(gulp.dest(paths.build.jsDir));  
});

gulp.task('script-page', function () {
    return gulp.src(paths.src.pageFiles)
        .pipe(gulp.dest(paths.build.jsDir));  
});

gulp.task('clean-dev', ['clean-build'], function (cb) {
    del.sync(paths.dev.cssDir);
    del.sync(paths.dev.jsDir);
    cb();
});

gulp.task('dev-favicon', function () {
    return gulp.src(paths.src.favicon)
        .pipe(gulp.dest(paths.dev.dir));
});

gulp.task('scripts', function (cb) {
    var tasks = [];

    forEachDir(paths.src.jsDir, function (dir) {
        if (dir === 'core' || dir === 'extend') {
            return ;
        }

        tasks.push(dir);
    });

    var tasksNum = tasks.length,
        finishTaskNum = 0;

    tasks.forEach(write);

    function finishTask () {
        finishTaskNum++;

        if (finishTaskNum >= tasksNum) {
            cb();
        }
    }

    function write (dir) {

        var path = joinPath('./js/', dir, 'hbs');
        var exists = fs.existsSync(path);
        var filename = dir + '.js';

        path = joinPath(path, '*.hbs');

        if (exists) {
            var tmpdir = './tmp/' + dir;
            var handlebarsFile = dir + '.handlebars.js';

            // 生成handlebars编译文件
            var handlebarsStream =  gulp.src(path)
            .pipe(handlebars())
            .pipe(wrap('Handlebars.template(<%= contents %>)'))
            .pipe(declare({
              namespace: 'Template.' + dir,  // 命名空间：JST.{dir}
              noRedeclare: true // Avoid duplicate declarations
            }))
            .pipe(concat(handlebarsFile))
            .pipe(gulp.dest(tmpdir));

            handlebarsStream.on('end', function () {
                notify();
            });

            function notify () {
                var files = [joinPath(tmpdir, handlebarsFile), joinPath('./js/' + dir + '/main.js')];

                var stream = gulp.src(files)
                .pipe(concat(filename))
                .pipe(gulp.dest(paths.build.jsDir));

                stream.on('end', finishTask);
            }
        }
    }
});

function forEachDir (path, func) {
    try {
        var array = fs.readdirSync(path);

        array.forEach(function (file, idx) {
            var p = joinPath(path, file);
            var stat = fs.statSync(p);

            if (stat.isDirectory()) {
                func(file);
            }
        });  
    } catch (ex) {
        console.error(ex);
    }
}

function joinPath () {
    return Path.join.apply(Path, arguments).replace(/\\/g, '/');
}

gulp.task('dev-js', ['script-core','script-extend','script-page', 'scripts'], function () {
    var jsStream = gulp.src(paths.build.jsFiles)
    .pipe(rename(function (path) {
        path.basename += '.min';
        path.extname = '.js';
    }))
    .pipe(gulp.dest(paths.dev.jsDir));

    return jsStream;
});

gulp.task('dev-css', ['sass'], function () {
    var cssStream = gulp.src(paths.build.cssFiles)
    .pipe(rename(function (path) {
        path.basename += '.min';
        path.extname = '.css';
    }))
    .pipe(gulp.dest(paths.dev.cssDir));

    return cssStream;
});

gulp.task('dev-image', function () {
    return gulp.src(paths.src.image)
    .pipe(gulp.dest(paths.dev.image));
});

gulp.task('dev-html', ['dev-js', 'dev-css'], function () {
    return gulp.src(paths.src.html)
    .pipe(replaceSsi(false))
    .pipe(gulp.dest(paths.dev.htmlDir));
});

gulp.task('clean-dist', ['dev'], function (cb) {
    del.sync(paths.dist.dir);
    cb();
});

gulp.task('js-min', ['clean-dist'], function () {
    var jsStream = gulp.src(paths.build.jsFiles)
    .pipe(uglify().on('error', gulpUtil.log))
    .pipe(rename(function (path) {
        path.basename += '.min';
        path.extname = '.js';
    }))
    .pipe(gulp.dest(paths.dist.jsDir));

    return jsStream;
});

gulp.task('css-min', ['clean-dist', 'image-min'], function () {
     var cssStream = gulp.src(paths.build.cssFiles)
    .pipe(minifyCSS({keepBreaks:true, compatibility: 'ie8'}))
    .pipe(rename(function (path) {
        path.basename += '.min';
        path.extname = '.css';
    }))
    .pipe(gulp.dest(paths.dist.cssDir));

    return cssStream;
});

gulp.task('html-min', ['clean-dist'], function () {
    var htmlStream = gulp.src(paths.src.html)
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest(paths.dist.htmlDir));

    return htmlStream;
});

gulp.task('rev', ['js-min', 'css-min', 'image-min', 'html-min'], function () {
    var revStream = gulp.src(paths.rev.assets, { base: paths.rev.base })
    .pipe(gulp.dest(paths.dist.dir))//原件
    .pipe(rev())
    .pipe(gulp.dest(paths.dist.dir))//md5后
    .pipe(rev.manifest({path: paths.rev.manifest.name}))
    .pipe(gulp.dest(paths.rev.manifest.path));

    return revStream;
});

gulp.task('rev-collect', ['rev'], function () {
    var collectStream = gulp.src(paths.rev.collect.src)
    .pipe(revCollector())
    .pipe(gulp.dest(paths.rev.collect.dist));

    return collectStream;
});

gulp.task('image-min', ['clean-dist'], function () {
     return gulp.src(paths.src.image)
        .pipe(gulp.dest(paths.dist.image));
});

gulp.task('dist-favicon', ['clean-dist'], function () {
    return gulp.src(paths.src.favicon)
        .pipe(gulp.dest(paths.dist.dir));
});

gulp.task('dev', ['clean-dev', 'dev-js', 'dev-css', 'dev-html', 'dev-image', 'dev-favicon'], function (cb){
    cb();
});
gulp.task('dist', ['clean-dist', 'js-min', 'css-min', 'image-min', 'html-min', 'rev', 'rev-collect', 'dist-favicon']);
gulp.task('default', ['dev', 'watch']);