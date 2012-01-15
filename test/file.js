var terraform = require(__dirname+'/../lib/terraform')(__dirname+'/test_root');
var File = terraform.File;

var resolv_conf = new File('/etc/resolv.conf');
resolv_conf
  //.replace('nameserver\s+.+$', 'nameserver 10.10.6.4')
  .writeln('search somebiz.com')
  .done(function(err) {
    if (err) console.error(err);
    console.log('DONE!');
  });
