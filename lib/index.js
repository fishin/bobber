var Fs = require('fs');
var Hoek = require('hoek');
var Path = require('path');
var Smelt = require('smelt');
var Wreck = require('wreck');

var internals = {
    defaults: {
        apiUrl: 'https://api.github.com'
    }
};

module.exports = internals.Bobber = function (options) {

    var settings = Hoek.applyToDefaults(internals.defaults, options);
    internals.Bobber.settings = settings;
    internals.settings = settings;
    this.getElements = exports.getElements;
    this.getAllCommits = exports.getAllCommits;
    this.getCompareCommits = exports.getCompareCommits;
    this.getLatestCommit = exports.getLatestCommit;
    this.getLatestRemoteCommit = exports.getLatestRemoteCommit;
    this.getBranches = exports.getBranches;
    this.getOpenPullRequests = exports.getOpenPullRequests;
    this.validateUrl = exports.validateUrl;
    this.checkoutCode = exports.checkoutCode;
};

exports.checkoutCode = function(path, scm) {

    var smelt = new Smelt({ dirPath: path });
    var gitPath = Path.join(path, '.git');
    var command;
    if (Fs.existsSync( gitPath )) {
        command = 'git pull origin ' + scm.branch;
    } else {
        command = 'git clone --branch=' + scm.branch + ' ' + scm.url + ' .';
    }
    var commandResult = smelt.runCommand(command);
    var result = {
        startTime: commandResult.startTime,
        finishTime: commandResult.finishTime,
        status: commandResult.status,
        commands: [ commandResult ]
    };
    return result;
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
                message: entry[4].substr(0, entry[4].length - 1)
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

exports.getLatestRemoteCommit = function(scm) {

    var smelt = new Smelt({ dirPath: '.' });
    var result = smelt.runCommand('git ls-remote --heads origin');
    var resultArray = result.stdout.split('\n');
    for (var i = 0; i < resultArray.length; i++) {
       var commit = resultArray[i].split('refs/heads/')[0].trim();
       var branch = resultArray[i].split('refs/heads/')[1];
       if (branch === scm.branch) {
           return commit;
       }
    }
    return null;
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

internals.checkApiRateLimit = function(scm, cb) {

    var url = internals.Bobber.settings.apiUrl + '/rate_limit';
    var options = {
        headers:   { 'User-Agent': 'ficion' }
    };
    Wreck.get(url, options, function(err, res, payload) {

        var pl = JSON.parse(payload);
        return cb(pl);
    });
};

exports.getOpenPullRequests = function(scm, cb) {

    var delimiter = '://';
    if (scm.url.match('@') && !scm.url.match('://')) {
        delimiter = '@';
    }
    var proto = scm.url.split(delimiter)[0];
    var rest = scm.url.split(delimiter)[1];
    var repoUrl = rest.split('/')[0];
    var org = rest.split('/')[1];
    var repo = rest.split('/')[2];
    var url = internals.Bobber.settings.apiUrl + '/repos/' + org + '/' + repo + '/pulls';
    var options = {
        headers:   { 'User-Agent': 'ficion' }
    };

    internals.checkApiRateLimit(scm, function(payload) {

        if (payload.rate.remaining === 0) {
            console.log('hit rate limit');
            console.log(payload);
            return cb([]);
        } else {
            Wreck.get(url, options, function(err, res, payload) {

                var pl = JSON.parse(payload);
                if (pl.message) {
                    console.log(pl.message);
                    return cb([]);
                } else {
                    var prs = [];
                    for (var i = 0; i < pl.length; i++) {
                        prs[i] = {
                            number: pl[i].number,
                            title: pl[i].title,
                            commit: pl[i].head.sha,
                            mergeCommit: pl[i].merge_commit_sha,
                            shortCommit: pl[i].head.sha.substr(0,7),
                            repoUrl: scm.url
                        };
                    }
                    return cb(prs);
                }
            });
        }
    });
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
