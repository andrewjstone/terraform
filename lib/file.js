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
  this.ops_mode = null; // 'verify' | 'deploy'  
  this.ops_type = null; // 'modify' || 'install'

  // This is data used for verify()
  this.lines_inserted = [];
  this.lines_replaced = [];
  this.install_src = null;
  this.install_dst = null;
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

File.prototype.install = function(src) {
  var self = this;
  var err = null;
  this.ops_type= 'install';

  var fn = function(callback) {
    if (self.ops_mode === 'verify') {
      return fs.readFile(src, self.encoding, function(err, data) {
        if (err) return callback(err);
        self.install_src = data;
        fs.readFile(self.filename, self.encoding, function(err, data) {
          if (err) {
            self.install_dst = '';
          } else {
            self.install_dst = data;
          }
          callback();
        });
      });
    } 
    // Ops mode is 'deploy'. Just copy the file.
    var writeStream = fs.createWriteStream(self.filename);
    var readStream = fs.createReadStream(src);
    readStream.pipe(writeStream);
    readStream.on('error', function(e) {
      err = e;
    });
    readStream.on('end', function() {
      return callback(err);
    });
  };

  this.ops.push(fn);
  return this;
};

File.prototype.writeln = function(line) {
  var self = this;
  this.ops_type= 'modify'; 

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
  this.ops_type = 'modify';

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

File.prototype.verify_modifications = function(callback) {
  if (!this.lines_replaced.length && !this.lines_inserted.length) {
    return callback(null, {verified: true});
  }
  return callback(null, {
    verified: false,
    lines_replaced: this.lines_replaced,
    lines_inserted: this.lines_inserted
  });
};

File.prototype.verify_install = function(callback) {
  if (this.install_src === this.install_dst) return callback(null, {verified: true});
  return callback(null, {verified: false}); 
};

File.prototype.verify = function(callback) {
  var self = this;
  
  // reset the tracking data for this run of verify
  this.lines_replaced = []; 
  this.lines_inserted = [];
  this.install_src = null;
  this.install_dst = null;
  
  // Run operations in verification mode. Don't do the actual install.
  this.ops_mode = 'verify';

  async.series(this.ops, function(err) {
    if (err) return callback(err);
    if (self.ops_type === 'install') return self.verify_install(callback);
    return self.verify_modifications(callback);
  });
};

File.prototype.deploy_modifications = function(callback) {
  var self = this;
  var tmp = self.filename+'.tmp';
  var stream = fs.createWriteStream(tmp);
  self.lines.forEach(function(line) {
    stream.write(line+'\n', self.encoding);
  });
  stream.end();
  stream.on('close', function() { 
    return fs.rename(tmp, self.filename, callback);
  });
};

File.prototype.deploy = function(callback) {
  var self = this;

  // Run the operations in deploy mode. Perform actual writes.
  this.ops_mode = 'deploy';

  async.series(this.ops, function(err) {
    if (err) return callback(err);
    if (self.ops_type === 'modify') return self.deploy_modifications(callback);

    // Install already completed, so just return 
   return callback();
  });
};

