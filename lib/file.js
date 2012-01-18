/*
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
  this.lines_inserted = [];
  this.lines_replaced = [];
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
  if (this.lines) return callback(); 
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
    return self.read(function(err) {
      if (err) return callback(err);
      if (match(line, self.lines)) return callback();
      self.lines.push(line);
      self.lines_inserted.push(line);
      return callback();
    });
  };

  this.ops.push(fn);
  return this;
};

File.prototype.replace_lines = function(pattern, replacement) {
  for (var i = 0; i < this.lines.length; i++) {
    var line = this.lines[i].replace(pattern, replacement);
    if (line !== this.lines[i]) {
      this.lines[i] = line;
      this.lines_replaced.push(line); 
      break;
    }
  }
};

File.prototype.replaceln = function(pattern, replacement) {
  var self = this;

  var fn = function(callback) {
    return self.read(function(err) {
      if (err) return callback(err);
      self.replace_lines(pattern, replacement);
      return callback();
    });
  };

  this.ops.push(fn);
  return this;
};

File.prototype.verify = function(callback) {
  var self = this;
  // reset the tracking data for this run of verify
  this.lines_replaced = []; 
  this.lines_inserted = [];
  async.series(this.ops, function(err) {
    if (err) return callback(err);
    if (!self.lines_replaced.length && !self.lines_inserted.length) {
      return callback(null, {verified: true});
    }
    return callback(null, {
      lines_replaced: lines_replaced,
      lines_inserted: lines_inserted
    });
  });
};

File.prototype.install = function(from, to, callback) {
};

File.prototype.remove = function(path, callback) {
};

File.prototype.deploy = function(callback) {
  var self = this;
  async.series(this.ops, function(err) {
    if (err) return callback(err);
    var tmp = self.filename+'.tmp';
    var stream = fs.createWriteStream(tmp);
    self.lines.forEach(function(line) {
      stream.write(line+'\n', self.encoding);
    });
    stream.end();
    stream.on('close', function() { 
        return fs.rename(tmp, self.filename, callback);
    });
  });
};

