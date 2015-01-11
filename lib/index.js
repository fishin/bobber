var Fs = require('fs');
var Path = require('path');

var internals = {};

module.exports = internals.Bobber = function (options) {

    this.getCheckoutCommands = exports.getCheckoutCommands;
    this.getElements = exports.getElements;
};

exports.getCheckoutCommands = function (path, scm) {

   // load in scm.type prototype
   // assuming git for now
   var cmds = [];
   var gitPath = Path.join(path, '.git');
   if (Fs.existsSync( gitPath )) {
       //cmds.push('git config remote.origin.url ' + scm.url);
       cmds.push('git pull --depth=50 origin ' + scm.branch);
   }
   else {
       cmds.push('git clone --depth=50 --branch=' + scm.branch + ' ' + scm.url + ' .');
   }
   cmds.push('git rev-parse HEAD');
   //cmds.push('git rev-list commit_hash_from_here^..commit_hash_up_to_here');
   return cmds;
};

exports.getElements = function() {

    var elements = [];
    elements.push({ 'tag': 'Url', fieldType: 'text', name: 'scmUrl', placeHolder: 'https://github.com/fishin/bobber' });
    elements.push({ 'tag': 'Branch', fieldType: 'text', name: 'scmBranch', placeHolder: 'master' });
    return elements;
};
