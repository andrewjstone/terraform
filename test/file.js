var terraform = require(__dirname+'/../lib/terraform')(__dirname+'/staging');
var File = terraform.File;
var mocha = require('mocha');
var assert = require('assert');

// The actual file being tested
var resolv_conf = new File('/etc/resolv.conf');

describe('File', function() {
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

