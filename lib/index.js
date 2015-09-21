var Fs = require('fs');
var Hoek = require('hoek');
var Path = require('path');
var Smelt = require('smelt');
var Wreck = require('wreck');

var internals = {
    defaults: {
        github: {
            url: 'https://api.github.com'
        },
        mock: false
    }
};

module.exports = internals.Bobber = function (options) {

    var settings = Hoek.applyToDefaults(internals.defaults, options);
    internals.Bobber.settings = settings;
    internals.Bobber.getCheckoutCommand = exports.getCheckoutCommand;
    internals.settings = settings;
    this.getCheckoutCommand = exports.getCheckoutCommand;
    this.getElements = exports.getElements;
    this.getAllCommits = exports.getAllCommits;
    this.getCompareCommits = exports.getCompareCommits;
    this.getLatestCommit = exports.getLatestCommit;
    this.getLatestRemoteCommit = exports.getLatestRemoteCommit;
    this.getBranches = exports.getBranches;
    this.getPullRequests = exports.getPullRequests;
    this.getPullRequest = exports.getPullRequest;
    this.mergePullRequest = exports.mergePullRequest;
    this.updateCommitStatus = exports.updateCommitStatus;
    this.validateUrl = exports.validateUrl;
    this.checkoutCode = exports.checkoutCode;
    this.checkApiRateLimit = exports.checkApiRateLimit;
};

exports.getCheckoutCommand = function (options) {

    var gitPath = Path.join(options.path, '.git');
    if (Fs.existsSync(gitPath)) {
        return 'git pull origin ' + options.scm.branch;
    }
    return 'git clone --branch=' + options.scm.branch + ' ' + options.scm.url + ' .';
};

exports.checkoutCode = function (options, cb) {

    var smelt = new Smelt({ dirPath: options.path });
    var checkoutCommand = internals.Bobber.getCheckoutCommand(options);
    var commandResults = [];
    var status;
    var startTime = new Date().getTime();
    var finishTime;
    var result = {};
    smelt.runCommand(checkoutCommand, options.pidsObj, function (checkoutCommandResult) {

        commandResults.push(checkoutCommandResult);
        status = checkoutCommandResult.status;
        if (status === 'succeeded') {
            // check to see if there is a merge commit
            if (options.pr) {
                var parsedUrl = internals.parseUrl(options.scm.url);
                var branchCommand = 'git checkout -b prtest ' + options.scm.branch;
                smelt.runCommand(branchCommand, options.pidsObj, function (branchResult) {

                    commandResults.push(branchResult);
                    var mergeCommand = 'git pull ' + parsedUrl.proto + parsedUrl.delimiter + parsedUrl.repoUrl + '/' + options.pr.remoteUser + '/' + parsedUrl.repo + ' ' + options.scm.branch;
                    smelt.runCommand(mergeCommand, options.pidsObj, function (mergeCommitResult) {

                        commandResults.push(mergeCommitResult);
                        status = mergeCommitResult.status;
                        finishTime = new Date().getTime();
                        result = {
                            startTime: startTime,
                            finishTime: new Date().getTime(),
                            status: status,
                            commands: commandResults
                        };
                        return cb(result);
                    });
                });
            } else {
                finishTime = new Date().getTime();
                result = {
                    startTime: startTime,
                    finishTime: new Date().getTime(),
                    status: status,
                    commands: commandResults
                };
                return cb(result);
            }
        } else {
            finishTime = new Date().getTime();
            result = {
                startTime: startTime,
                finishTime: new Date().getTime(),
                status: status,
                commands: commandResults
            };
            return cb(result);
        }
    });
};

exports.getElements = function () {

    var elements = [];
    elements.push({ 'tag': 'Url', fieldType: 'text', name: 'scmUrl', placeHolder: 'https://github.com/fishin/bobber' });
    elements.push({ 'tag': 'Branch', fieldType: 'text', name: 'scmBranch', placeHolder: 'master' });
    return elements;
};

exports.getAllCommits = function (path, cb) {

    var smelt = new Smelt({ dirPath: path });
    var command = 'git log --pretty=format:"%H---%an---<%ae>---%ai---%s"';
    smelt.runCommand(command, null, function (result) {

        var commits = internals.processCommits(result);
        return cb(commits);
    });
};

exports.getCompareCommits = function (path, startCommit, endCommit, cb) {

    var smelt = new Smelt({ dirPath: path });
    var command = 'git log --pretty=format:"%H---%an---<%ae>---%ai---%s" ' + startCommit + '...' + endCommit;
    smelt.runCommand(command, null, function (result) {

        var commits = internals.processCommits(result);
        return cb(commits);
    });
};

internals.processCommits = function (result) {

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
                shortCommit: commit.substr(0, 7),
                authorName: entry[1],
                authorEmail: entry[2],
                authorDate: authorDate[0] + ' ' + authorDate[1],
                message: entry[4].substr(0, entry[4].length - 1)
            };
            gitLog.push(gitObj);
        }
        return gitLog;
    }
    //console.log('no result for commits');
    return [];
};

exports.getLatestCommit = function (path, cb) {

    var smelt = new Smelt({ dirPath: path });
    var command = 'git rev-parse HEAD';
    smelt.runCommand(command, null, function (result) {

        return cb(result.stdout.trim());
    });
};

exports.getLatestRemoteCommit = function (scm, cb) {

    var smelt = new Smelt({ dirPath: '.' });
    var command = 'git ls-remote --heads origin';
    smelt.runCommand(command, null, function (result) {

        var resultArray = result.stdout.split('\n');
        for (var i = 0; i < resultArray.length; i++) {
            var commit = resultArray[i].split('refs/heads/')[0].trim();
            var branch = resultArray[i].split('refs/heads/')[1];
            if (branch === scm.branch) {
                return cb(commit);
            }
        }
        return cb(null);
    });
};

exports.getBranches = function (path, cb) {

    var branches = [];
    var smelt = new Smelt({ dirPath: path });
    var command = 'git ls-remote --heads origin';
    smelt.runCommand(command, null, function (result) {

        var resultArray = result.stdout.split('\n');
        for (var i = 0; i < resultArray.length; i++) {
            branches[i] = resultArray[i].split('refs/heads/')[1];
        }
        return cb(branches);
    });
};

exports.checkApiRateLimit = function (scm, token, cb) {

    var url = internals.Bobber.settings.github.url + '/rate_limit';
    //console.log(url);
    var options = {
        headers: {
            'User-Agent': 'ficion'
        },
        json: true
    };
    //console.log('token: ' + token);
    if (token) {
        options.headers.Authorization = 'token ' + token;
    }
    Wreck.get(url, options, function (err, res, payload) {

        //console.log(err);
        //console.log(payload);
        var pl = payload;
        if (pl.rate.remaining === 0) {
            console.log('hit rate limit');
            return cb(pl);
        }
        return cb(null);
    });
};

exports.getPullRequests = function (scm, token, cb) {

    var parsedUrl = internals.parseUrl(scm.url);
    var url = internals.Bobber.settings.github.url + '/repos/' + parsedUrl.org + '/' + parsedUrl.repo + '/pulls';
    var options = {
        headers: {
            'User-Agent': 'ficion',
            'X-OAuth-Scopes': 'repo'
        },
        json: true
    };
    if (token) {
        options.headers.Authorization = 'token ' + token;
    }
    Wreck.get(url, options, function (err, res, payload) {

        var pl = payload;
        if (pl.message) {
            console.log(pl.message);
            return cb([]);
        }
        var prs = [];
        for (var i = 0; i < pl.length; i++) {
            prs[i] = {
                number: pl[i].number,
                title: pl[i].title,
                commit: pl[i].head.sha,
                remoteUser: pl[i].head.label.split(':')[0],
                remoteBranch: pl[i].head.label.split(':')[1],
                mergeCommit: pl[i].merge_commit_sha,
                shortCommit: pl[i].head.sha.substr(0, 7),
                repoUrl: scm.url
            };
        }
        prs.sort(function (a, b){

            return a.number - b.number;
        });
        return cb(prs);
    });
};

exports.validateUrl = function (scm, cb) {

    if (internals.Bobber.settings.mock) {
        return cb(true);
    } else if (scm.url.match('https://github.com')) {
        // check to see if its valid
        var smelt = new Smelt({ dirPath: '/tmp' });
        var rewriteUrl = scm.url.replace('https://github.com', 'https://anon:anon@github.com');
        var command = 'git ls-remote ' + rewriteUrl;
        smelt.runCommand(command, null, function (result) {

            if (result.stderr) {
                return cb(false);
            }
            return cb(true);
        });
    } else {
        return cb(true);
    }
};

exports.getPullRequest = function (scm, number, token, cb) {

    var parsedUrl = internals.parseUrl(scm.url);
    var url = internals.Bobber.settings.github.url + '/repos/' + parsedUrl.org + '/' + parsedUrl.repo + '/pulls/' + number;
    var options = {
        headers: {
            'User-Agent': 'ficion',
            'X-OAuth-Scopes': 'repo'
        },
        json: true
    };
    if (token) {
        options.headers.Authorization = 'token ' + token;
    }

    Wreck.get(url, options, function (err, res, payload) {

        var pl = payload;
        if (pl.message) {
            console.log(pl.message);
            return cb(null);
        }
        var pr = {
            number: pl.number,
            title: pl.title,
            commit: pl.head.sha,
            mergeCommit: pl.merge_commit_sha,
            remoteUser: pl.head.label.split(':')[0],
            remoteBranch: pl.head.label.split(':')[1],
            shortCommit: pl.head.sha.substr(0, 7),
            repoUrl: scm.url
        };
        return cb(pr);
    });
};

exports.mergePullRequest = function (scm, number, token, cb) {

    var parsedUrl = internals.parseUrl(scm.url);
    var url = internals.Bobber.settings.github.url + '/repos/' + parsedUrl.org + '/' + parsedUrl.repo + '/pulls/' + number + '/merge';
    var options = {
        headers: {
            'User-Agent': 'ficion',
            'Authorization': 'token ' + token,
            'Content-Type': 'application/json',
            'X-OAuth-Scopes': 'repo'
        },
        json: true,
        payload: '{ "commit_message": "Pull Request successfully merged" }'
    };

    Wreck.put(url, options, function (err, res, payload) {

        if (payload.message) {
            var pl = payload;
            if (!pl.merged) {
                pl.error = pl.message;
                pl.merged = false;
            }
            //console.log(pl);
            return cb(pl);
        }
        var error = {
            error: payload,
            merged: false
        };
        return cb(error);
    });
};

exports.updateCommitStatus = function (scm, commit, state, token, cb) {

    var parsedUrl = internals.parseUrl(scm.url);
    var url = internals.Bobber.settings.github.url + '/repos/' + parsedUrl.org + '/' + parsedUrl.repo + '/statuses/' + commit;
    var targetUrl = 'http://localhost:8080';
    var options = {
        headers: {
            'User-Agent': 'ficion',
            'Authorization': 'token ' + token,
            'Content-Type': 'application/json',
            'X-OAuth-Scopes': 'repo'
        },
        json: true,
        payload: '{ "state": "' + state + '", "target_url": "' + targetUrl + '", "description": "' + state + '", "context": "continuous-integration/ficion" }'
    };

    Wreck.post(url, options, function (err, res, payload) {

        if (payload.state) {
            var pl = payload;
            //console.log(pl);
            return cb(pl);
        }
        var error = {
            error: payload
        };
        return cb(error);
    });
};

internals.parseUrl = function (url) {

    var parsedUrl = {};
    var delimiter = '://';
    if (url.match('@') && !url.match('://')) {
        delimiter = '@';
    }
    parsedUrl.proto = url.split(delimiter)[0];
    var rest = url.split(delimiter)[1];
    parsedUrl.repoUrl = rest.split('/')[0];
    parsedUrl.org = rest.split('/')[1];
    parsedUrl.repo = rest.split('/')[2];
    parsedUrl.delimiter = delimiter;
    return parsedUrl;
};
