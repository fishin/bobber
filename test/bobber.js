var Code = require('code');
var Fs = require('fs');
var Hapi = require('hapi');
var Lab = require('lab');
var Path = require('path');
var Pail = require('pail');

var Bobber = require('../lib');

var internals = {};

var lab = exports.lab = Lab.script();
var expect = Code.expect;
var describe = lab.describe;
var it = lab.it;

var bobberPath = __dirname + '/tmp';

internals.mockGithub = function (rateLimit, repo, merge, callback) {

    var server = new Hapi.Server();
    server.connection();
    server.route([
        {
            method: 'GET',
            path: '/rate_limit',
            handler: {
                file: __dirname + '/fixtures/' + rateLimit + '.json'
            }
        },
        {
            method: 'GET',
            path: '/repos/org/' + repo + '/pulls',
            handler: {
                file: __dirname + '/fixtures/pulls_' + repo + '.json'
            }
        },
        {
            method: 'GET',
            path: '/repos/org/' + repo + '/pulls/14',
            handler: {
                file: __dirname + '/fixtures/pulls_' + repo + '_14.json'
            }
        },
        {
            method: 'PUT',
            path: '/repos/org/' + repo + '/pulls/14/merge',
            handler: {
                file: __dirname + '/fixtures/pulls_' + repo + '_14_' + merge + '.json'
            }
        }
    ]);
    callback(server);
};

describe('bobber', function () {

    it('checkoutCode new', function (done) {

        var pail = new Pail({dirPath: bobberPath});
        var config = pail.createPail({name: 'checkoutCode'});
        pail.createDir(config.id + '/workspace');
        var scm = {
            type: 'github',
            branch: 'master',
            url: 'https://github.com/fishin/bobber'
        };
        var bobber = new Bobber({});
        var result = bobber.checkoutCode(bobberPath + '/' + config.id + '/workspace', scm);
        expect(result.startTime).to.exist();
        expect(result.finishTime).to.exist();
        expect(result.commands[0].command).to.include('git clone');
        expect(result.commands[0].stderr).to.include('Cloning into');
        expect(result.status).to.equal('succeeded');
        done();
    });

    it('checkoutCode existing', function (done) {

        var scm = {
            type: 'github',
            branch: 'master',
            url: 'git@github.com:fishin/bobber'
        };
        var bobber = new Bobber({});
        var pail = new Pail({dirPath: bobberPath});
        var pails = pail.getPails();
        var config = pail.getPail(pails[0]);
        var result = bobber.checkoutCode(bobberPath + '/' + config.id + '/workspace', scm);
        expect(result.startTime).to.exist();
        expect(result.finishTime).to.exist();
        expect(result.commands[0].stderr).to.include('fishin/bobber');
        expect(result.commands[0].stdout).to.include('Already up-to-date.');
        expect(result.commands[0].command).to.include('git pull origin master');
        expect(result.status).to.equal('succeeded');
        // cleanup
        pail.deletePail(config.id);
        Fs.rmdirSync(bobberPath);
        done();
    });

    it('getElements', function (done) {

        var bobber = new Bobber({});
        var elements = bobber.getElements();
        //console.log(elements);
        expect(elements).to.be.length(2);
        done();
    });

    it('getAllCommits none', function (done) {

        var bobber = new Bobber({});
        // get commits for this repo
        var commits = bobber.getAllCommits('/tmp');
        expect(commits.length).to.equal(0);
        done();
    });

    it('getAllCommits', function (done) {

        var bobber = new Bobber({});
        // get commits for this repo
        var commits = bobber.getAllCommits('.');
        expect(commits.length).to.above(0);
        done();
    });

    it('getLatestCommit', function (done) {

        var bobber = new Bobber({});
        // get commits for this repo
        var commit = bobber.getLatestCommit('.');
        expect(commit.length).to.equal(40);
        done();
    });

    it('getLatestRemoteCommit', function (done) {

        var bobber = new Bobber({});
        var scm = {
            branch: 'master'
        };
        var commit = bobber.getLatestRemoteCommit(scm);
        expect(commit.length).to.equal(40);
        done();
    });

    it('getLatestRemoteCommit invalid', function (done) {

        var bobber = new Bobber({});
        var scm = {
            branch: 'master1'
        };
        var commit = bobber.getLatestRemoteCommit('.', scm);
        expect(commit).to.not.exist();
        done();
    });

    it('getPullRequests rate_limit https user', function (done) {

        internals.mockGithub('rate_limit', 'repo', 'merge', function (server) {

            server.start(function() {

                var bobber = new Bobber({apiUrl: server.info.uri});
                var scm = {
                    url: 'https://anon:anon@github.com/org/repo'
                };
                var token = 1;
                bobber.getPullRequests(scm, token, function(prs) {

                    //console.log(prs);
                    expect(prs.length).to.be.above(0);
                    expect(prs[0].number).to.be.above(0);
                    expect(prs[0].commit.length).to.equal(40);
                    expect(prs[0].mergeCommit.length).to.equal(40);
                    expect(prs[0].shortCommit.length).to.equal(7);
                    expect(prs[0].repoUrl).to.equal('https://anon:anon@github.com/org/repo');
                    server.stop();
                    done();
                });
            });
        });
    });

    it('getPullRequest', function (done) {

        internals.mockGithub('rate_limit', 'repo', 'merge', function (server) {

            server.start(function() {

                var bobber = new Bobber({apiUrl: server.info.uri});
                var scm = {
                    url: 'https://github.com/org/repo'
                };
                var token = 1;
                bobber.getPullRequest(scm, 14, token, function(pr) {

                    //console.log(pr);
                    expect(pr.number).to.be.above(0);
                    expect(pr.commit.length).to.equal(40);
                    expect(pr.mergeCommit.length).to.equal(40);
                    expect(pr.shortCommit.length).to.equal(7);
                    expect(pr.repoUrl).to.equal('https://github.com/org/repo');
                    server.stop();
                    done();
                });
            });
        });
    });

    it('mergePullRequest', function (done) {

        internals.mockGithub('rate_limit', 'repo', 'merge', function (server) {

            server.start(function() {

                var bobber = new Bobber({apiUrl: server.info.uri});
                var scm = {
                    url: 'https://github.com/org/repo'
                };
                var token = 1;
                var number = 14;
                bobber.mergePullRequest(scm, number, token, function(result) {

                    //console.log(result);
                    expect(result.sha.length).to.equal(40);
                    expect(result.merged).to.be.true();
                    expect(result.message).to.equal('Pull Request successfully merged');
                    server.stop();
                    done();
                });
            });
        });
    });

    it('getPullRequests rate_limit https', function (done) {

        internals.mockGithub('rate_limit', 'repo', 'merge', function (server) {

            server.start(function() {

                var bobber = new Bobber({apiUrl: server.info.uri});
                var scm = {
                    url: 'https://github.com/org/repo'
                };
                var token = 1;
                bobber.getPullRequests(scm, token, function(prs) {

                    //console.log(prs);
                    expect(prs.length).to.be.above(0);
                    expect(prs[0].number).to.be.above(0);
                    expect(prs[0].commit.length).to.equal(40);
                    expect(prs[0].mergeCommit.length).to.equal(40);
                    expect(prs[0].shortCommit.length).to.equal(7);
                    expect(prs[0].repoUrl).to.equal('https://github.com/org/repo');
                    server.stop();
                    done();
                });
            });
        });
    });

    it('getPullRequests rate_limit ssh', function (done) {

        internals.mockGithub('rate_limit', 'repo', 'merge', function (server) {

            server.start(function() {

                var bobber = new Bobber({apiUrl: server.info.uri});
                var scm = {
                    url: 'git@github.com/org/repo'
                };
                var token = 1;
                bobber.getPullRequests(scm, token, function(prs) {

                    //console.log(prs);
                    expect(prs.length).to.be.above(0);
                    expect(prs[0].number).to.be.above(0);
                    expect(prs[0].commit.length).to.equal(40);
                    expect(prs[0].mergeCommit.length).to.equal(40);
                    expect(prs[0].shortCommit.length).to.equal(7);
                    expect(prs[0].repoUrl).to.equal('git@github.com/org/repo');
                    server.stop();
                    done();
                });
            });
        });
    });

    it('getPullRequests rate_limit_reached', function (done) {

        internals.mockGithub('rate_limit_reached', 'repo', 'merge', function (server) {

            server.start(function() {

                var bobber = new Bobber({apiUrl: server.info.uri});
                var scm = {
                    url: 'https://anon:anon@github.com/org/repo'
                };
                var token = 1;
                bobber.getPullRequests(scm, token, function(prs) {

                    //console.log(prs);
                    expect(prs.length).to.equal(0);
                    server.stop();
                    done();
                });
            });
        });
    });

    it('getPullRequests invalid', function (done) {

        internals.mockGithub('rate_limit', 'invalid', 'merge', function (server) {

            server.start(function() {

                var bobber = new Bobber({apiUrl: server.info.uri});
                var scm = {
                    url: 'https://anon:anon@github.com/org/invalid'
                };
                var token = 1;
                bobber.getPullRequests(scm, token, function(prs) {

                    //console.log(prs);
                    expect(prs.length).to.equal(0);
                    server.stop();
                    done();
                });
            });
        });
    });

    it('getBranches', function (done) {

        var bobber = new Bobber({});
        // get commits for this repo
        var branches = bobber.getBranches('.');
        //console.log(branches);
        expect(branches.length).to.above(0);
        done();
    });

    it('getCompareCommits', function (done) {

        var bobber = new Bobber({});
        // get commits for this repo
        var commits = bobber.getAllCommits('.');
        var prevCommit = commits[1].commit;
        var commitsCompare = bobber.getCompareCommits('.', commits[0].commit, commits[1].commit);
        //console.log(commitsCompare);
        expect(commitsCompare.length).to.be.above(0);
        done();
    });

    it('validUrl ssh', function (done) {

        var bobber = new Bobber({});
        // get commits for this repo
        var scm = {
            type: 'github',
            branch: 'master',
            url: 'git@github.com:fishin/bobber'
        };
        expect(bobber.validateUrl(scm)).to.be.true();
        done();
    });

    it('validateUrl https valid', function (done) {

        var bobber = new Bobber({});
        // get commits for this repo
        var scm = {
            type: 'github',
            branch: 'master',
            url: 'https://github.com/fishin/bobber'
        };
        expect(bobber.validateUrl(scm)).to.be.true();
        done();
    });

    it('validateUrl https invalid', function (done) {

        var bobber = new Bobber({});
        // get commits for this repo
        var scm = {
            type: 'github',
            branch: 'master',
            url: 'https://github.com/fishin/invalid'
        };
        expect(bobber.validateUrl(scm)).to.be.false();
        done();
    });
});
