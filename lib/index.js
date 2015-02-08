var Fs = require('fs');
var Path = require('path');
var Smelt = require('smelt');

var internals = {};

module.exports = internals.Bobber = function (options) {

    this.getCheckoutCommands = exports.getCheckoutCommands;
    this.getElements = exports.getElements;
    this.getAllCommits = exports.getAllCommits;
    this.getCompareCommits = exports.getCompareCommits;
    this.getLatestCommit = exports.getLatestCommit;
    this.getBranches = exports.getBranches;
    this.validateUrl = exports.validateUrl;
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

exports.getAllCommits = function(path) {

    var smelt = new Smelt({ dirPath: path });
    var command = 'git log --pretty=format:"%H---%an---<%ae>---%ai---%s"';
    var result = smelt.runCommand(command);
    var commits = internals.processCommits(result);
    return commits;
};

exports.getCompareCommits = function(path, startCommit, endCommit) {

    var smelt = new Smelt({ dirPath: path });
    var command = 'git log --pretty=format:"%H---%an---<%ae>---%ai---%s" ' + startCommit + '...' + endCommit;
    var result = smelt.runCommand(command);
    var commits = internals.processCommits(result);
    return commits;
};

internals.processCommits = function(result) {

    if (result.stdout) {
        var history = result.stdout.split('\n');
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
        return gitLog;
    } else {
        //console.log('no result for commits');
        return [];
    }
};


exports.getLatestCommit = function(path) {

    var smelt = new Smelt({ dirPath: path });
    var result = smelt.runCommand('git rev-parse HEAD');
    return result.stdout;
};

exports.getBranches = function(path) {

    var branches = [];
    var smelt = new Smelt({ dirPath: path });
    var result = smelt.runCommand('git ls-remote --heads origin');
    var resultArray = result.stdout.split('\n');
    for (var i = 0; i < resultArray.length; i++) {
       branches[i] = resultArray[i].split('refs/heads/')[1];
    }
    return branches;
};

exports.validateUrl = function(scm) {

    if (scm.url.match('https://github.com')) {
        // check to see if its valid
        var smelt = new Smelt({ dirPath: '/tmp' });
        var rewriteUrl = scm.url.replace('https://github.com','https://anon:anon@github.com');
        var result = smelt.runCommand('git ls-remote ' + rewriteUrl);
        if (result.stderr) {
            return false;
        } else {
            return true;
        }
    } else {
       return true;
    }
};
