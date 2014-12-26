var Fs = require('fs');
var Path = require('path');

var internals = {};

module.exports = internals.Bobber = function (options) {

    this.getCheckoutCommand = exports.getCheckoutCommand;
    this.getElements = exports.getElements;
};

exports.getCheckoutCommand = function (path, scm) {

   // load in scm.type prototype
   // assuming git for now
   var cmd = null;
   var gitPath = Path.join(path, '.git');
   if (Fs.existsSync( gitPath )) {
       cmd = 'git pull --depth=50 origin ' + scm.branch;
   }
   else {
       cmd = 'git clone --depth=50 --branch=' + scm.branch + ' ' + scm.url + ' .';
   }
   return cmd;
};

exports.getElements = function() {

    var elements = [];
    elements.push({ 'tag': 'Url', fieldType: 'text', name: 'scm_url', placeHolder: 'https://github.com/fishin/bobber' });
    elements.push({ 'tag': 'Branch', fieldType: 'text', name: 'scm_branch', placeHolder: 'master' });
    return elements;
}
