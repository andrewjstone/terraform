Simple machine provisioning with Node.js.

![terraform](http://upload.wikimedia.org/wikipedia/commons/thumb/7/78/TerraformedMars.jpg/210px-TerraformedMars.jpg);

## Overview

Terraform is a set of modules used to create machine provisioning scripts. This project is currently in pre-alpha state and lots of things are missing. Documentation will be added along with code and everything is subject to change.

## File

The file module is used to make changes to config files, and to install and remove files from a base system.

```javascript
// Set the root of the install. On production systems this will be '/'. 
var terraform = require('terraform')('/home/ajs/test_root');

// create the terraform file object with the path relative to the root of the install.
var resolv_conf = new terraform.File('/etc/resolv.conf');

// set the nameserver to 10.10.6.4 and add a search path
resolv_conf
  .replaceln(/^nameserver.+$/, 'nameserver 10.10.6.4')
  .writeln('search somebiz.com')
  .deploy(done);`
``` 

The above javascript will read in ```/home/ajs/test_root/etc/resolv.conf``` which looks like the following

    nameserver 127.0.0.1

and write 

    nameserver 10.10.6.4
    search somebiz.com
   
## License

### The MIT License (MIT)

Copyright (c) 2012 Andrew J. Stone

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
