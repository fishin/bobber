var Fs = require('fs');
var Path = require('path');
var Smelt = require('smelt');

var internals = {};

module.exports = internals.Bobber = function (options) {

    this.getCheckoutCommands = exports.getCheckoutCommands;
    this.getElements = exports.getElements;
    this.getCommits = exports.getCommits;
    this.getLatestCommit = exports.getLatestCommit;
};

exports.getCheckoutCommands = function (path, scm) {

   // load in scm.type prototype
   // assuming git for now
   var cmds = [];
   var gitPath = Path.join(path, '.git');
   if (Fs.existsSync( gitPath )) {
       //cmds.push('git config remote.origin.url ' + scm.url);
       //cmds.push('git pull --depth=50 origin ' + scm.branch);
       cmds.push('git pull origin ' + scm.branch);
   }
   else {
       //cmds.push('git clone --depth=50 --branch=' + scm.branch + ' ' + scm.url + ' .');
       cmds.push('git clone --branch=' + scm.branch + ' ' + scm.url + ' .');
   }
   //cmds.push('git rev-parse HEAD');
   cmds.push('git log --pretty=format:"%H---%an---<%ae>---%ai---%s"');
   //cmds.push('git rev-list commit_hash_from_here^..commit_hash_up_to_here');
   return cmds;
};

exports.getElements = function() {

    var elements = [];
    elements.push({ 'tag': 'Url', fieldType: 'text', name: 'scmUrl', placeHolder: 'https://github.com/fishin/bobber' });
    elements.push({ 'tag': 'Branch', fieldType: 'text', name: 'scmBranch', placeHolder: 'master' });
    return elements;
};

exports.getCommits = function(path, comp, cb) {

    var smelt = new Smelt({ dirPath: path });
    var command = 'git log --pretty=format:"%H---%an---<%ae>---%ai---%s"';
//  need to compare against a last known commit to get all the diffs
//    if (comp) {
//        command = command + ' this.Bobber.getLatestCommit(path) + '..' + comp;
//    }
    smelt.runCommand(command, function(result) {

       var history = result.stdout.split('\n');;
       var gitLog = [];
       for (var i = 0; i < history.length; i++) {
           //console.log(i + ' ' + history[i]);
           var entry = history[i].split('---');
           var commit = entry[0].substr(1, entry[0].length);
           var authorDate = entry[3].split(' ');
           var gitObj = {
               commit: commit,
               shortCommit: commit.substr(0,7),
               authorName: entry[1],
               authorEmail: entry[2],
               authorDate: authorDate[0] + ' ' + authorDate[1],
               message: entry[4].substr(0, entry[4].length-1)
           };
           gitLog.push(gitObj);
       }
       //console.log(gitLog);
       return cb(gitLog);
    });
};

exports.getLatestCommit = function(path, cb) {

    var smelt = new Smelt({ dirPath: path });
    smelt.runCommand('git rev-parse HEAD', function(result) {

        return cb(result.stdout.trim());
    });
};
