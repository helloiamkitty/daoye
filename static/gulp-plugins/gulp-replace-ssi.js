var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var Path = require('path');
var fs = require('fs');

// consts
const PLUGIN_NAME = 'gulp-prefixer';

// plugin level function (dealing with files)
function gulpPrefixer(isDist) {
  // creating a stream through which each file will pass
  var stream = through.obj(function(file, enc, cb) {
    if (file.isStream()) {
      this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
      return cb();
    }

    if (file.isBuffer()) {
      if(isDist) {//ssi的set指令不支持从include文件中读取，所以直接写到页面中 ##忽略
        var path = Path.join('dist/', 'ssi/file-map.html');
        var mapStr = fs.readFileSync(path, 'utf8');
        file.contents = new Buffer(file.contents.toString('utf8')
          .replace(/<!--#file_map-->/g, mapStr)
        );
      } else {//开发环境将ssi内容写到页面中
        file.contents = new Buffer(file.contents.toString('utf8')
          .replace(/<!--#include\s+virtual="?([^"\s]+)"?\s*-->/g, function (match, group) {
            //对bar页面做特殊处理
            var path = /\.\./.test(group) ? Path.join('html', group.replace(/\.\./, '')) : Path.join('html', group);
            return fs.readFileSync(path, 'utf8');
          })
          );
      }
    }

    // make sure the file goes through the next gulp plugin
    this.push(file);

    // tell the stream engine that we are done with this file
    cb();
  });

  // returning the file stream
  return stream;
};

// exporting the plugin main function
module.exports = gulpPrefixer;