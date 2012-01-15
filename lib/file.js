/*
 * This module uses lazy operations. For instance, if replace isn't called
 * the file will not be split into lines. 
 *
 * The whole file is read into memory for write operations. This is fine 
 * for config files. When 'done' is called the data is written to a 
 * temporary file. Then the file is renamed to the proper config
 * file. This prevents partial file writes.
 */

var fs = require('fs');
var async = require('async');

var File = module.exports = function(filename, encoding) {
  this.filename = File.root + filename;
  this.encoding = encoding || 'utf8';
  this.lines = null;
  this.ops = [];
};

function match(line, lines) {
  var found = false;
  for (var i = 0; i < lines.length; i++) {
    if (lines[i] === line) {
      found = true;
      break;
    }
  };
  return found;
};

File.prototype.read = function(callback) {
  var self = this;
  return fs.readFile(self.filename, self.encoding, function(err, data) {
    if (err) return callback(err);
    self.lines = data.split('\n');
    if (self.lines[self.lines.length-1] == '') self.lines.pop();
    return callback();
  });
};

File.prototype.writeln = function(line) {
  var self = this;

  var fn = function(callback) {
    if (!self.lines) {
        return self.read(function(err) {
          if (err) return callback(err);
          if (match(line, self.lines)) return callback();
          self.lines.push(line);
          return callback();
        });
    }
    if (match(line, self.lines)) return callback();
    self.lines.push(line);
    return callback();
  };

  this.ops.push(fn);
  return this;
};

File.prototype.replace = function(pattern, replacement) {
};

File.prototype.install = function(from, to, callback) {
};

File.prototype.done = function(callback) {
  var self = this;
  var fn = function(cb) {
    var tmp = self.filename+'.tmp';
    var stream = fs.createWriteStream(tmp);
    self.lines.forEach(function(line) {
      stream.write(line+'\n', self.encoding);
    });
    stream.end();
    stream.on('close', function() { 
        fs.rename(tmp, self.filename, cb);
    });
  };
  this.ops.push(fn);
  async.series(this.ops, callback);
};

