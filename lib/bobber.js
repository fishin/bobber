var Fs = require('fs');
var Path = require('path');

exports.getCheckoutCommand = function (path, scm) {

   // load in scm.type prototype
   // assuming git for now
   var cmd = null;
   var gitPath = Path.join(path, '.git');
   if (Fs.existsSync( gitPath )) {
       cmd = 'git pull';
   }
   else {
       cmd = 'git clone -q --branch=' + scm.branch + ' ' + scm.url + ' .';
   }

   return cmd;
};
