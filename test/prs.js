var Code = require('code');
var Fs = require('fs');
var Hoek = require('hoek');
var Lab = require('lab');
var Mock = require('mock');
var Path = require('path');
var Pail = require('pail');

var Bobber = require('../lib');

var internals = {};

var lab = exports.lab = Lab.script();
var expect = Code.expect;
var describe = lab.describe;
var it = lab.it;

describe('pull requests', function () {

    it('getPullRequests rate_limit https user notoken', function (done) {

        var type = 'github';
        var routes = [
            {
                method: 'get',
                path: '/repos/org/repo/pulls',
                file: 'index.json'
            }
        ];
        Mock.prepareServer(type, routes, function (server) {

            server.start(function () {

                //console.log(server.info);
                var bobber = new Bobber({ github: { url: server.info.uri } });
                var scm = {
                    url: 'https://anon:anon@github.com/org/repo'
                };
                bobber.getPullRequests(scm, null, function (prs) {

                    //console.log(prs);
                    expect(prs.length).to.be.above(0);
                    expect(prs[0].number).to.be.above(0);
                    expect(prs[0].commit.length).to.equal(40);
                    expect(prs[0].mergeCommit.length).to.equal(40);
                    expect(prs[0].shortCommit.length).to.equal(7);
                    expect(prs[0].repoUrl).to.equal('https://anon:anon@github.com/org/repo');
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });

    it('getPullRequests rate_limit https user token', function (done) {

        var type = 'github';
        var routes = [
            {
                method: 'get',
                path: '/repos/org/repo/pulls',
                file: 'index.json'
            }
        ];
        Mock.prepareServer(type, routes, function (server) {

            server.start(function () {

                //console.log(server.info);
                var bobber = new Bobber({ github: { url: server.info.uri } });
                var scm = {
                    url: 'https://anon:anon@github.com/org/repo'
                };
                var token = 1;
                bobber.getPullRequests(scm, token, function (prs) {

                    //console.log(prs);
                    expect(prs.length).to.be.above(0);
                    expect(prs[0].number).to.be.above(0);
                    expect(prs[0].commit.length).to.equal(40);
                    expect(prs[0].mergeCommit.length).to.equal(40);
                    expect(prs[0].shortCommit.length).to.equal(7);
                    expect(prs[0].repoUrl).to.equal('https://anon:anon@github.com/org/repo');
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });

    it('getPullRequest rate_limit notoken', function (done) {

        var type = 'github';
        var routes = [
            {
                method: 'get',
                path: '/repos/org/repo/pulls/1',
                file: 'index.json'
            }
        ];
        Mock.prepareServer(type, routes, function (server) {

            server.start(function () {

                var bobber = new Bobber({ github: { url: server.info.uri } });
                var scm = {
                    url: 'https://github.com/org/repo'
                };
                var number = 1;
                bobber.getPullRequest(scm, number, null, function (pr) {

                    //console.log(pr);
                    expect(pr.number).to.be.above(0);
                    expect(pr.commit.length).to.equal(40);
                    expect(pr.mergeCommit.length).to.equal(40);
                    expect(pr.shortCommit.length).to.equal(7);
                    expect(pr.repoUrl).to.equal('https://github.com/org/repo');
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });

    it('getPullRequest rate_limit_reached notoken', function (done) {

        var type = 'github';
        var routes = [
            {
                method: 'get',
                path: '/repos/org/repo/pulls/1',
                file: 'reached.json'
            }
        ];
        Mock.prepareServer(type, routes, function (server) {

            server.start(function () {

                var bobber = new Bobber({ github: { url: server.info.uri } });
                var scm = {
                    url: 'https://github.com/org/repo'
                };
                var number = 1;
                bobber.getPullRequest(scm, number, null, function (pr) {

                    //console.log(pr);
                    expect(pr).to.not.exist();
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });

    it('getPullRequest rate_limit token', function (done) {

        var type = 'github';
        var routes = [
            {
                method: 'get',
                path: '/repos/org/repo/pulls/1',
                file: 'index.json'
            }
        ];
        Mock.prepareServer(type, routes, function (server) {

            server.start(function () {

                var bobber = new Bobber({ github: { url: server.info.uri } });
                var scm = {
                    url: 'https://github.com/org/repo'
                };
                var token = 1;
                var number = 1;
                bobber.getPullRequest(scm, number, token, function (pr) {

                    //console.log(pr);
                    expect(pr.number).to.be.above(0);
                    expect(pr.commit.length).to.equal(40);
                    expect(pr.mergeCommit.length).to.equal(40);
                    expect(pr.shortCommit.length).to.equal(7);
                    expect(pr.repoUrl).to.equal('https://github.com/org/repo');
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });

    it('getPullRequest rate_limit token notfound', function (done) {

        var type = 'github';
        var routes = [
            {
                method: 'get',
                path: '/repos/org/repo/pulls/1',
                file: 'notfound.json'
            }
        ];
        Mock.prepareServer(type, routes, function (server) {

            server.start(function () {

                var bobber = new Bobber({ github: { url: server.info.uri } });
                var scm = {
                    url: 'https://github.com/org/repo'
                };
                var token = 1;
                var number = 1;
                bobber.getPullRequest(scm, number, token, function (pr) {

                    //console.log(pr);
                    expect(pr).to.not.exist();
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });

    it('updateCommitStatus rate_limit', function (done) {

        var type = 'github';
        var routes = [
            {
                method: 'post',
                path: '/repos/org/repo/statuses/1',
                file: 'index.json'
            },
            {
                method: 'get',
                path: '/rate_limit',
                file: 'authorized.json'
            }
        ];
        Mock.prepareServer(type, routes, function (server) {

            server.start(function () {

                var bobber = new Bobber({ github: { url: server.info.uri } });
                var scm = {
                    url: 'https://github.com/org/repo'
                };
                var state = 'pending';
                var commit = 1;
                var token = 1;
                bobber.updateCommitStatus(scm, commit, state, token, function (result) {

                    //console.log(result);
                    expect(result.state).to.equal('pending');
                    expect(result.description).to.equal('pending');
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });

    it('updateCommitStatus rate_limit_reached', function (done) {

        var type = 'github';
        var routes = [
            {
                method: 'post',
                path: '/repos/org/repo/statuses/1',
                file: 'index.json'
            },
            {
                method: 'get',
                path: '/rate_limit',
                file: 'reached.json'
            }
        ];
        Mock.prepareServer(type, routes, function (server) {

            server.start(function () {

                var bobber = new Bobber({ github: { url: server.info.uri } });
                var scm = {
                    url: 'https://github.com/org/repo'
                };
                var state = 'pending';
                var commit = 1;
                var token = 1;
                bobber.updateCommitStatus(scm, commit, state, token, function (result) {

                    //console.log(result);
                    expect(result.error).to.exist();
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });

    it('updateCommitStatus notfound', function (done) {

        var type = 'github';
        var routes = [
            {
                method: 'post',
                path: '/repos/org/repo/statuses/1',
                file: 'notfound.json'
            },
            {
                method: 'get',
                path: '/rate_limit',
                file: 'authorized.json'
            }
        ];
        Mock.prepareServer(type, routes, function (server) {

            server.start(function () {

                var bobber = new Bobber({ github: { url: server.info.uri } });
                var scm = {
                    url: 'https://github.com/org/repo'
                };
                var state = 'pending';
                var commit = 1;
                var token = 1;
                bobber.updateCommitStatus(scm, commit, state, token, function (result) {

                    //console.log(result);
                    expect(result.error).to.exist();
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });

    it('mergePullRequest merge rate_limit', function (done) {

        var type = 'github';
        var routes = [
            {
                method: 'put',
                path: '/repos/org/repo/pulls/1/merge',
                file: 'index.json'
            }
        ];
        Mock.prepareServer(type, routes, function (server) {

            server.start(function () {

                var bobber = new Bobber({ github: { url: server.info.uri } });
                var scm = {
                    url: 'https://github.com/org/repo'
                };
                var token = 1;
                var number = 1;
                bobber.mergePullRequest(scm, number, token, function (result) {

                    //console.log(result);
                    expect(result.sha.length).to.equal(40);
                    expect(result.error).to.not.exist();
                    expect(result.merged).to.be.true();
                    expect(result.message).to.equal('Pull Request successfully merged');
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });

    it('mergePullRequest merge rate_limit error.txt', function (done) {

        var type = 'github';
        var routes = [
            {
                method: 'put',
                path: '/repos/org/repo/pulls/1/merge',
                file: 'error.txt'
            }
        ];
        Mock.prepareServer(type, routes, function (server) {

            server.start(function () {

                var bobber = new Bobber({ github: { url: server.info.uri } });
                var scm = {
                    url: 'https://github.com/org/repo'
                };
                var token = 1;
                var number = 1;
                bobber.mergePullRequest(scm, number, token, function (result) {

                    //console.log(result);
                    expect(result.error).to.exist();
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });

    it('mergePullRequest mergefail rate_limit', function (done) {

        var type = 'github';
        var routes = [
            {
                method: 'put',
                path: '/repos/org/repo/pulls/1/merge',
                file: 'fail.json'
            }
        ];
        Mock.prepareServer(type, routes, function (server) {

            server.start(function () {

                var bobber = new Bobber({ github: { url: server.info.uri } });
                var scm = {
                    url: 'https://github.com/org/repo'
                };
                var token = 1;
                var number = 1;
                bobber.mergePullRequest(scm, number, token, function (result) {

                    //console.log(result);
                    expect(result.merged).to.be.false();
                    expect(result.error).to.equal('Pull Request is not mergeable');
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });

    it('mergePullRequest merge rate_limit_reached', function (done) {

        var type = 'github';
        var routes = [
            {
                method: 'put',
                path: '/repos/org/repo/pulls/1/merge',
                file: 'reached.json'
            }
        ];
        Mock.prepareServer(type, routes, function (server) {

            server.start(function () {

                var bobber = new Bobber({ github: { url: server.info.uri } });
                var scm = {
                    url: 'https://github.com/org/repo'
                };
                var token = 1;
                var number = 1;
                bobber.mergePullRequest(scm, number, token, function (result) {

                    //console.log(result);
                    expect(result.error).to.exist();
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });

    it('getPullRequests rate_limit https', function (done) {

        var type = 'github';
        var routes = [
            {
                method: 'get',
                path: '/repos/org/repo/pulls',
                file: 'index.json'
            }
        ];
        Mock.prepareServer(type, routes, function (server) {

            server.start(function () {

                var bobber = new Bobber({ github: { url: server.info.uri } });
                var scm = {
                    url: 'https://github.com/org/repo'
                };
                bobber.getPullRequests(scm, null, function (prs) {

                    //console.log(prs);
                    expect(prs.length).to.be.above(0);
                    expect(prs[0].number).to.be.above(0);
                    expect(prs[0].commit.length).to.equal(40);
                    expect(prs[0].mergeCommit.length).to.equal(40);
                    expect(prs[0].shortCommit.length).to.equal(7);
                    expect(prs[0].repoUrl).to.equal('https://github.com/org/repo');
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });

    it('getPullRequests rate_limit ssh', function (done) {

        var type = 'github';
        var routes = [
            {
                method: 'get',
                path: '/repos/org/repo/pulls',
                file: 'index.json'
            }
        ];
        Mock.prepareServer(type, routes, function (server) {

            server.start(function () {

                var bobber = new Bobber({ github: { url: server.info.uri } });
                var scm = {
                    url: 'git@github.com/org/repo'
                };
                bobber.getPullRequests(scm, null, function (prs) {

                    //console.log(prs);
                    expect(prs.length).to.be.above(0);
                    expect(prs[0].number).to.be.above(0);
                    expect(prs[0].commit.length).to.equal(40);
                    expect(prs[0].mergeCommit.length).to.equal(40);
                    expect(prs[0].shortCommit.length).to.equal(7);
                    expect(prs[0].repoUrl).to.equal('git@github.com/org/repo');
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });

    it('getPullRequests rate_limit_reached', function (done) {

        var type = 'github';
        var routes = [
            {
                method: 'get',
                path: '/repos/org/repo/pulls',
                file: 'reached.json'
            }
        ];
        Mock.prepareServer(type, routes, function (server) {

            server.start(function () {

                var bobber = new Bobber({ github: { url: server.info.uri } });
                var scm = {
                    url: 'https://anon:anon@github.com/org/repo'
                };
                bobber.getPullRequests(scm, null, function (prs) {

                    //console.log(prs);
                    expect(prs.length).to.equal(0);
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });

    it('getPullRequests invalid', function (done) {

        var type = 'github';
        var routes = [
            {
                method: 'get',
                path: '/repos/org/invalid/pulls',
                file: 'notfound.json'
            }
        ];
        Mock.prepareServer(type, routes, function (server) {

            server.start(function () {

                var bobber = new Bobber({ github: { url: server.info.uri } });
                var scm = {
                    url: 'https://anon:anon@github.com/org/invalid'
                };
                bobber.getPullRequests(scm, null, function (prs) {

                    //console.log(prs);
                    expect(prs.length).to.equal(0);
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });

    it('checkApiRateLimit reached no token', function (done) {

        var type = 'github';
        var routes = [
            {
                method: 'get',
                path: '/rate_limit',
                file: 'reached.json'
            }
        ];
        Mock.prepareServer(type, routes, function (server) {

            server.start(function () {

                var bobber = new Bobber({ github: { url: server.info.uri } });
                var scm = {
                    url: 'https://github.com/org/repo'
                };
                bobber.checkApiRateLimit(scm, null, function (result) {

                    //console.log(result);
                    expect(result.rate.remaining).to.equal(0);
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });

    it('checkApiRateLimit token', function (done) {

        var type = 'github';
        var routes = [
            {
                method: 'get',
                path: '/rate_limit',
                file: 'authorized.json'
            }
        ];
        Mock.prepareServer(type, routes, function (server) {

            server.start(function () {

                var bobber = new Bobber({ github: { url: server.info.uri } });
                var scm = {
                    url: 'https://github.com/org/repo'
                };
                var token = 1;
                bobber.checkApiRateLimit(scm, token, function (result) {

                    //console.log(result);
                    expect(result).to.not.exist();
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });

    it('checkApiRateLimit no token', function (done) {

        var type = 'github';
        var routes = [
            {
                method: 'get',
                path: '/rate_limit',
                file: 'anonymous.json'
            }
        ];
        Mock.prepareServer(type, routes, function (server) {

            server.start(function () {

                var bobber = new Bobber({ github: { url: server.info.uri } });
                var scm = {
                    url: 'https://github.com/org/repo'
                };
                bobber.checkApiRateLimit(scm, null, function (result) {

                    //console.log(result);
                    expect(result).to.not.exist();
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });
});
