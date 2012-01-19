var mocha = require('mocha');
var assert = require('assert');

var terraform = require(__dirname+'/../lib/terraform')(__dirname+'/staging');
var File = terraform.File;

var resolv_conf = new File('/etc/resolv.conf');
var bashrc = new File('/home/ajs/.bashrc'); 

describe('Modify /etc/resolv.conf', function() {
  it('should deploy without error', function(done){
    resolv_conf
      .replaceln(/^nameserver.+$/, 'nameserver 10.10.6.4')
      .writeln('search somebiz.com')
      .deploy(done);
  });

  it('should verify without error', function(done) {
    resolv_conf.verify(function(err, result) {
      if (err) return done(err);
      assert.deepEqual(result.verified, true);
      done();
    });
  });
});

describe('Install .bashrc', function() {
  it('should install without error', function(done) {
    bashrc
      .install(__dirname+'/proof/home/ajs/.bashrc')
      .deploy(done);
  });

  it('should verify without error', function(done) {
    bashrc.verify(function(err, result) {
      if (err) return done(err);
      assert.deepEqual(result.verified, true);
      done();
    });
  });
});
