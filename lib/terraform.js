var root = null;
var terraform = module.exports = function(rootdir){
  root = rootdir || '/';
  terraform.File.root = root;
  return terraform;
};
terraform.File = require('./file');
