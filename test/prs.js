'use strict';

const Code = require('code');
const Hoek = require('hoek');
const Lab = require('lab');
const Mock = require('mock');

const Bobber = require('../lib');

const internals = {};

const lab = exports.lab = Lab.script();
const expect = Code.expect;
const describe = lab.describe;
const it = lab.it;

describe('pull requests', () => {

    it('getPullRequests rate_limit https user notoken', (done) => {

        const type = 'github';
        const routes = [
            {
                method: 'get',
                path: '/repos/org/repo/pulls',
                file: 'index.json'
            }
        ];
        Mock.prepareServer(type, routes, (server) => {

            server.start(() => {

                //console.log(server.info);
                const bobber = new Bobber({ github: { url: server.info.uri } });
                const scm = {
                    url: 'https://anon:anon@github.com/org/repo'
                };
                bobber.getPullRequests(scm, null, (prs) => {

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

    it('getPullRequests rate_limit https user token', (done) => {

        const type = 'github';
        const routes = [
            {
                method: 'get',
                path: '/repos/org/repo/pulls',
                file: 'index.json'
            }
        ];
        Mock.prepareServer(type, routes, (server) => {

            server.start(() => {

                //console.log(server.info);
                const bobber = new Bobber({ github: { url: server.info.uri } });
                const scm = {
                    url: 'https://anon:anon@github.com/org/repo'
                };
                const token = 1;
                bobber.getPullRequests(scm, token, (prs) => {

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

    it('getPullRequest rate_limit notoken', (done) => {

        const type = 'github';
        const routes = [
            {
                method: 'get',
                path: '/repos/org/repo/pulls/1',
                file: 'index.json'
            }
        ];
        Mock.prepareServer(type, routes, (server) => {

            server.start(() => {

                const bobber = new Bobber({ github: { url: server.info.uri } });
                const scm = {
                    url: 'https://github.com/org/repo'
                };
                const number = 1;
                bobber.getPullRequest(scm, number, null, (pr) => {

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

    it('getPullRequest rate_limit_reached notoken', (done) => {

        const type = 'github';
        const routes = [
            {
                method: 'get',
                path: '/repos/org/repo/pulls/1',
                file: 'reached.json'
            }
        ];
        Mock.prepareServer(type, routes, (server) => {

            server.start(() => {

                const bobber = new Bobber({ github: { url: server.info.uri } });
                const scm = {
                    url: 'https://github.com/org/repo'
                };
                const number = 1;
                bobber.getPullRequest(scm, number, null, (pr) => {

                    //console.log(pr);
                    expect(pr).to.not.exist();
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });

    it('getPullRequest null payload', (done) => {

        const type = 'github';
        const routes = [
            {
                method: 'get',
                path: '/repos/org/repo/pulls/1',
                file: 'null'
            }
        ];
        Mock.prepareServer(type, routes, (server) => {

            server.start(() => {

                const bobber = new Bobber({ github: { url: server.info.uri } });
                const scm = {
                    url: 'https://github.com/org/repo'
                };
                const number = 1;
                bobber.getPullRequest(scm, number, null, (pr) => {

                    //console.log(pr);
                    expect(pr).to.not.exist();
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });

    it('getPullRequest rate_limit token', (done) => {

        const type = 'github';
        const routes = [
            {
                method: 'get',
                path: '/repos/org/repo/pulls/1',
                file: 'index.json'
            }
        ];
        Mock.prepareServer(type, routes, (server) => {

            server.start(() => {

                const bobber = new Bobber({ github: { url: server.info.uri } });
                const scm = {
                    url: 'https://github.com/org/repo'
                };
                const token = 1;
                const number = 1;
                bobber.getPullRequest(scm, number, token, (pr) => {

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

    it('getPullRequest rate_limit token notfound', (done) => {

        const type = 'github';
        const routes = [
            {
                method: 'get',
                path: '/repos/org/repo/pulls/1',
                file: 'notfound.json'
            }
        ];
        Mock.prepareServer(type, routes, (server) => {

            server.start(() => {

                const bobber = new Bobber({ github: { url: server.info.uri } });
                const scm = {
                    url: 'https://github.com/org/repo'
                };
                const token = 1;
                const number = 1;
                bobber.getPullRequest(scm, number, token, (pr) => {

                    //console.log(pr);
                    expect(pr).to.not.exist();
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });

    it('updateCommitStatus rate_limit', (done) => {

        const type = 'github';
        const routes = [
            {
                method: 'post',
                path: '/repos/org/repo/statuses/1',
                file: 'index.json'
            }
        ];
        Mock.prepareServer(type, routes, (server) => {

            server.start(() => {

                const bobber = new Bobber({ github: { url: server.info.uri } });
                const scm = {
                    url: 'https://github.com/org/repo'
                };
                const state = 'pending';
                const commit = 1;
                const token = 1;
                bobber.updateCommitStatus(scm, commit, state, token, (result) => {

                    //console.log(result);
                    expect(result.state).to.equal('pending');
                    expect(result.description).to.equal('pending');
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });

    it('updateCommitStatus rate_limit_reached', (done) => {

        const type = 'github';
        const routes = [
            {
                method: 'post',
                path: '/repos/org/repo/statuses/1',
                file: 'reached.json'
            }
        ];
        Mock.prepareServer(type, routes, (server) => {

            server.start(() => {

                const bobber = new Bobber({ github: { url: server.info.uri } });
                const scm = {
                    url: 'https://github.com/org/repo'
                };
                const state = 'pending';
                const commit = 1;
                const token = 1;
                bobber.updateCommitStatus(scm, commit, state, token, (result) => {

                    //console.log(result);
                    expect(result.error).to.exist();
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });

    it('updateCommitStatus notfound', (done) => {

        const type = 'github';
        const routes = [
            {
                method: 'post',
                path: '/repos/org/repo/statuses/1',
                file: 'notfound.json'
            }
        ];
        Mock.prepareServer(type, routes, (server) => {

            server.start(() => {

                const bobber = new Bobber({ github: { url: server.info.uri } });
                const scm = {
                    url: 'https://github.com/org/repo'
                };
                const state = 'pending';
                const commit = 1;
                const token = 1;
                bobber.updateCommitStatus(scm, commit, state, token, (result) => {

                    //console.log(result);
                    expect(result.error).to.exist();
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });

    it('mergePullRequest merge rate_limit', (done) => {

        const type = 'github';
        const routes = [
            {
                method: 'put',
                path: '/repos/org/repo/pulls/1/merge',
                file: 'index.json'
            }
        ];
        Mock.prepareServer(type, routes, (server) => {

            server.start(() => {

                const bobber = new Bobber({ github: { url: server.info.uri } });
                const scm = {
                    url: 'https://github.com/org/repo'
                };
                const token = 1;
                const number = 1;
                bobber.mergePullRequest(scm, number, token, (result) => {

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

    it('mergePullRequest merge rate_limit error.txt', (done) => {

        const type = 'github';
        const routes = [
            {
                method: 'put',
                path: '/repos/org/repo/pulls/1/merge',
                file: 'error.txt'
            }
        ];
        Mock.prepareServer(type, routes, (server) => {

            server.start(() => {

                const bobber = new Bobber({ github: { url: server.info.uri } });
                const scm = {
                    url: 'https://github.com/org/repo'
                };
                const token = 1;
                const number = 1;
                bobber.mergePullRequest(scm, number, token, (result) => {

                    //console.log(result);
                    expect(result.error).to.exist();
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });

    it('mergePullRequest mergefail rate_limit', (done) => {

        const type = 'github';
        const routes = [
            {
                method: 'put',
                path: '/repos/org/repo/pulls/1/merge',
                file: 'fail.json'
            }
        ];
        Mock.prepareServer(type, routes, (server) => {

            server.start(() => {

                const bobber = new Bobber({ github: { url: server.info.uri } });
                const scm = {
                    url: 'https://github.com/org/repo'
                };
                const token = 1;
                const number = 1;
                bobber.mergePullRequest(scm, number, token, (result) => {

                    //console.log(result);
                    expect(result.merged).to.be.false();
                    expect(result.error).to.equal('Pull Request is not mergeable');
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });

    it('mergePullRequest merge rate_limit_reached', (done) => {

        const type = 'github';
        const routes = [
            {
                method: 'put',
                path: '/repos/org/repo/pulls/1/merge',
                file: 'reached.json'
            }
        ];
        Mock.prepareServer(type, routes, (server) => {

            server.start(() => {

                const bobber = new Bobber({ github: { url: server.info.uri } });
                const scm = {
                    url: 'https://github.com/org/repo'
                };
                const token = 1;
                const number = 1;
                bobber.mergePullRequest(scm, number, token, (result) => {

                    //console.log(result);
                    expect(result.error).to.exist();
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });

    it('getPullRequests rate_limit https', (done) => {

        const type = 'github';
        const routes = [
            {
                method: 'get',
                path: '/repos/org/repo/pulls',
                file: 'index.json'
            }
        ];
        Mock.prepareServer(type, routes, (server) => {

            server.start(() => {

                const bobber = new Bobber({ github: { url: server.info.uri } });
                const scm = {
                    url: 'https://github.com/org/repo'
                };
                bobber.getPullRequests(scm, null, (prs) => {

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

    it('getPullRequests rate_limit ssh', (done) => {

        const type = 'github';
        const routes = [
            {
                method: 'get',
                path: '/repos/org/repo/pulls',
                file: 'index.json'
            }
        ];
        Mock.prepareServer(type, routes, (server) => {

            server.start(() => {

                const bobber = new Bobber({ github: { url: server.info.uri } });
                const scm = {
                    url: 'git@github.com:org/repo'
                };
                bobber.getPullRequests(scm, null, (prs) => {

                    //console.log(prs);
                    expect(prs.length).to.be.above(0);
                    expect(prs[0].number).to.be.above(0);
                    expect(prs[0].commit.length).to.equal(40);
                    expect(prs[0].mergeCommit.length).to.equal(40);
                    expect(prs[0].shortCommit.length).to.equal(7);
                    expect(prs[0].repoUrl).to.equal('git@github.com:org/repo');
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });

    it('getPullRequests rate_limit_reached', (done) => {

        const type = 'github';
        const routes = [
            {
                method: 'get',
                path: '/repos/org/repo/pulls',
                file: 'reached.json'
            }
        ];
        Mock.prepareServer(type, routes, (server) => {

            server.start(() => {

                const bobber = new Bobber({ github: { url: server.info.uri } });
                const scm = {
                    url: 'https://anon:anon@github.com/org/repo'
                };
                bobber.getPullRequests(scm, null, (prs) => {

                    //console.log(prs);
                    expect(prs.length).to.equal(0);
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });

    it('getPullRequests null payload', (done) => {

        const type = 'github';
        const routes = [
            {
                method: 'get',
                path: '/repos/org/repo/pulls',
                file: 'null'
            }
        ];
        Mock.prepareServer(type, routes, (server) => {

            server.start(() => {

                const bobber = new Bobber({ github: { url: server.info.uri } });
                const scm = {
                    url: 'https://anon:anon@github.com/org/repo'
                };
                bobber.getPullRequests(scm, null, (prs) => {

                    //console.log(prs);
                    expect(prs.length).to.equal(0);
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });

    it('getPullRequests invalid', (done) => {

        const type = 'github';
        const routes = [
            {
                method: 'get',
                path: '/repos/org/invalid/pulls',
                file: 'notfound.json'
            }
        ];
        Mock.prepareServer(type, routes, (server) => {

            server.start(() => {

                const bobber = new Bobber({ github: { url: server.info.uri } });
                const scm = {
                    url: 'https://anon:anon@github.com/org/invalid'
                };
                bobber.getPullRequests(scm, null, (prs) => {

                    //console.log(prs);
                    expect(prs.length).to.equal(0);
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });

    it('checkApiRateLimit reached no token', (done) => {

        const type = 'github';
        const routes = [
            {
                method: 'get',
                path: '/rate_limit',
                file: 'reached.json'
            }
        ];
        Mock.prepareServer(type, routes, (server) => {

            server.start(() => {

                const bobber = new Bobber({ github: { url: server.info.uri } });
                const scm = {
                    url: 'https://github.com/org/repo'
                };
                bobber.checkApiRateLimit(scm, null, (result) => {

                    //console.log(result);
                    expect(result.rate.remaining).to.equal(0);
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });

    it('checkApiRateLimit token', (done) => {

        const type = 'github';
        const routes = [
            {
                method: 'get',
                path: '/rate_limit',
                file: 'authorized.json'
            }
        ];
        Mock.prepareServer(type, routes, (server) => {

            server.start(() => {

                const bobber = new Bobber({ github: { url: server.info.uri } });
                const scm = {
                    url: 'https://github.com/org/repo'
                };
                const token = 1;
                bobber.checkApiRateLimit(scm, token, (result) => {

                    //console.log(result);
                    expect(result).to.not.exist();
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });

    it('checkApiRateLimit no token', (done) => {

        const type = 'github';
        const routes = [
            {
                method: 'get',
                path: '/rate_limit',
                file: 'anonymous.json'
            }
        ];
        Mock.prepareServer(type, routes, (server) => {

            server.start(() => {

                const bobber = new Bobber({ github: { url: server.info.uri } });
                const scm = {
                    url: 'https://github.com/org/repo'
                };
                bobber.checkApiRateLimit(scm, null, (result) => {

                    //console.log(result);
                    expect(result).to.not.exist();
                    server.stop(Hoek.ignore);
                    done();
                });
            });
        });
    });
});
