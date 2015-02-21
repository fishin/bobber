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
        },
        {
            method: 'POST',
            path: '/repos/org/' + repo + '/statuses/1',
            handler: {
                file: __dirname + '/fixtures/repo_statuses_1.json'
            }
        }
    ]);
    callback(server);
};

describe('pull requests', function () {

    it('getPullRequests rate_limit https user', function (done) {

        internals.mockGithub('rate_limit', 'repo', 'merge', function (server) {

            server.start(function() {

                var bobber = new Bobber({apiUrl: server.info.uri});
                var scm = {
                    url: 'https://anon:anon@github.com/org/repo'
                };
                bobber.getPullRequests(scm, null, function(prs) {

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
                bobber.getPullRequest(scm, 14, null, function(pr) {

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

    it('updateCommitStatus', function (done) {

        internals.mockGithub('rate_limit', 'repo', 'merge', function (server) {

            server.start(function() {

                var bobber = new Bobber({apiUrl: server.info.uri});
                var scm = {
                    url: 'https://github.com/org/repo'
                };
                var state = 'pending';
                var commit = 1;
                var token = 1;
                bobber.updateCommitStatus(scm, commit, state, token, function(result) {

                    //console.log(result);
                    expect(result.state).to.equal('pending');
                    expect(result.description).to.equal('pending');
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
                bobber.getPullRequests(scm, null, function(prs) {

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
                bobber.getPullRequests(scm, null, function(prs) {

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
                bobber.getPullRequests(scm, null, function(prs) {

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
                bobber.getPullRequests(scm, null, function(prs) {

                    //console.log(prs);
                    expect(prs.length).to.equal(0);
                    server.stop();
                    done();
                });
            });
        });
    });
});
