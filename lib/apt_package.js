var exec = require('child_process').exec;

var AptPackage = module.exports = function(name) {
  this.name = name;
};

AptPackage.prototype.install = function(callback) {
  exec('apt-get install -y '+this.name, callback);
};

AptPackage.prototype.remove = function(callback) {
  exec('apt-get --purge remove '+this.name, callback);
};

AptPackage.prototype.verify = function(callback) {
  exec('dpkg -s '+this.name+' | grep Status', function(err, stdout, stderr) {
    if (err) return callback(err, stdout, stderr);
    if (stdout === 'Status: install ok installed') return callback(null, {verified: true});
    return callback(null, {verified: false, stdout: stdout, stderr: stderr});
  });
};

AptPackage.prototype.status = function(callback) {
  exec('dpkg -s '+this.name, callback);
};
