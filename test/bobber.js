'use strict';

const Code = require('code');
const Lab = require('lab');
const Pail = require('pail');

const Bobber = require('../lib');

const internals = {};

const lab = exports.lab = Lab.script();
const expect = Code.expect;
const describe = lab.describe;
const it = lab.it;


describe('bobber', () => {

    it('checkoutCode new', (done) => {

        const bobberPath = __dirname + '/tmp';
        const pail = new Pail({ dirPath: bobberPath });
        const config = pail.createPail({ name: 'checkoutCode' });
        pail.createDir(config.id + '/workspace');
        const scm = {
            type: 'github',
            branch: 'master',
            url: 'https://github.com/fishin/bobber'
        };
        const bobber = new Bobber({});
        const options = {
            path: bobberPath + '/' + config.id + '/workspace',
            scm: scm,
            pr: null,
            pidsObj: null
        };
        bobber.checkoutCode(options, (result) => {

            expect(result.startTime).to.exist();
            expect(result.finishTime).to.exist();
            expect(result.commands[0].command).to.include('git clone');
            expect(result.commands[0].stderr).to.include('Cloning into');
            expect(result.status).to.equal('succeeded');
            done();
        });
    });

    it('checkoutCode existing', (done) => {

        const bobberPath = __dirname + '/tmp';
        const scm = {
            type: 'github',
            branch: 'master',
            url: 'git@github.com:fishin/bobber'
        };
        const bobber = new Bobber({});
        const pail = new Pail({ dirPath: bobberPath });
        const pails = pail.getPails();
        const config = pail.getPail(pails[0]);
        const options = {
            path: bobberPath + '/' + config.id + '/workspace',
            scm: scm,
            pr: null,
            pidsObj: null
        };
        bobber.checkoutCode(options, (result) => {

            expect(result.startTime).to.exist();
            expect(result.finishTime).to.exist();
            expect(result.commands[0].stderr).to.include('fishin/bobber');
            expect(result.commands[0].stdout).to.include('Already up-to-date.');
            expect(result.commands[0].command).to.include('git pull origin master');
            expect(result.status).to.equal('succeeded');
            // cleanup
            pail.deletePail(config.id);
            done();
        });
    });

    it('checkoutCode mergeCommit merge', (done) => {

        const bobberPath = __dirname + '/tmp';
        const pail = new Pail({ dirPath: bobberPath });
        const config = pail.createPail({ name: 'checkoutMerge' });
        pail.createDir(config.id + '/workspace');
        const scm = {
            type: 'github',
            branch: 'master',
            url: 'https://github.com/fishin/demo'
        };
        const bobber = new Bobber({});
        bobber.getPullRequests(scm, null, (prs) => {

            //console.log(prs);
            expect(prs.length).to.be.above(0);
            expect(prs[0].number).to.be.above(0);
            expect(prs[0].commit.length).to.equal(40);
            expect(prs[0].mergeCommit.length).to.equal(40);
            expect(prs[0].shortCommit.length).to.equal(7);
            expect(prs[0].repoUrl).to.equal('https://github.com/fishin/demo');
            const options = {
                path: bobberPath + '/' + config.id + '/workspace',
                scm: scm,
                pr: prs[0],
                pidsObj: null
            };
            bobber.checkoutCode(options, (result) => {

                //console.log(result);
                expect(result.startTime).to.exist();
                expect(result.finishTime).to.exist();
                expect(result.commands.length).to.equal(3);
                expect(result.commands[2].command).to.include('git pull');
                expect(result.status).to.equal('succeeded');
                bobber.getLatestCommit(bobberPath + '/' + config.id + '/workspace', (commit) => {

                    expect(commit.length).to.equal(40);
                    pail.deletePail(config.id);
                    done();
                });
            });
        });
    });

    it('checkoutCode mergeCommit git clone fail', (done) => {

        const bobberPath = __dirname + '/tmp';
        const pail = new Pail({ dirPath: bobberPath });
        const config = pail.createPail({ name: 'checkoutMergeFail' });
        pail.createDir(config.id + '/workspace');
        const scm = {
            type: 'github',
            branch: 'master',
            url: 'https://anon@anon:github.com/fishin/invalid'
        };
        const bobber = new Bobber({});
        const options = {
            path: bobberPath + '/' + config.id + '/workspace',
            scm: scm,
            pr: {},
            pidsObj: null
        };
        bobber.checkoutCode(options, (result) => {

            //console.log(result);
            expect(result.startTime).to.exist();
            expect(result.finishTime).to.exist();
            expect(result.commands[0].command).to.include('git clone');
            expect(result.commands[0].stderr).to.include('fatal:');
            expect(result.status).to.equal('failed');
            bobber.getLatestCommit(bobberPath + '/' + config.id + '/workspace', (commit) => {

                pail.deletePail(config.id);
                done();
            });
        });
    });

    it('getElements', (done) => {

        const bobber = new Bobber({});
        const elements = bobber.getElements();
        //console.log(elements);
        expect(elements).to.be.length(2);
        done();
    });

    it('getAllCommits none', (done) => {

        const bobber = new Bobber({});
        // get commits for this repo
        bobber.getAllCommits('/tmp', (commits) => {

            expect(commits.length).to.equal(0);
            done();
        });
    });

    it('getAllCommits', (done) => {

        const bobber = new Bobber({});
        // get commits for this repo
        bobber.getAllCommits('.', (commits) => {

            expect(commits.length).to.above(0);
            done();
        });
    });

    it('getLatestCommit', (done) => {

        const bobber = new Bobber({});
        // get commits for this repo
        bobber.getLatestCommit('.', (commit) => {

            expect(commit.length).to.equal(40);
            done();
        });
    });

    it('getLatestRemoteCommit', (done) => {

        const bobber = new Bobber({});
        const scm = {
            branch: 'master'
        };
        bobber.getLatestRemoteCommit(scm, (commit) => {

            expect(commit.length).to.equal(40);
            done();
        });
    });

    it('getLatestRemoteCommit invalid', (done) => {

        const bobber = new Bobber({});
        const scm = {
            branch: 'master1'
        };
        bobber.getLatestRemoteCommit(scm, (commit) => {

            expect(commit).to.not.exist();
            done();
        });
    });

    it('getBranches', (done) => {

        const bobber = new Bobber({});
        // get commits for this repo
        bobber.getBranches('.', (branches) => {

            //console.log(branches);
            expect(branches.length).to.above(0);
            done();
        });
    });

    it('getCompareCommits', (done) => {

        const bobber = new Bobber({});
        // get commits for this repo
        bobber.getAllCommits('.', (commits) => {

            bobber.getCompareCommits('.', commits[0].commit, commits[1].commit, (commitsCompare) => {

                //console.log(commitsCompare);
                expect(commitsCompare.length).to.be.above(0);
                done();
            });
        });
    });

    it('validateUrl ssh', (done) => {

        const bobber = new Bobber({});
        // get commits for this repo
        const scm = {
            type: 'github',
            branch: 'master',
            url: 'git@github.com:fishin/bobber'
        };
        bobber.validateUrl(scm, (result) => {

            expect(result).to.be.true();
            done();
        });
    });

    it('validateUrl https valid', (done) => {

        const bobber = new Bobber({});
        // get commits for this repo
        const scm = {
            type: 'github',
            branch: 'master',
            url: 'https://github.com/fishin/bobber'
        };
        bobber.validateUrl(scm, (result) => {

            expect(result).to.be.true();
            done();
        });
    });

    it('validateUrl https invalid', (done) => {

        const bobber = new Bobber({});
        // get commits for this repo
        const scm = {
            type: 'github',
            branch: 'master',
            url: 'https://github.com/fishin/invalid'
        };
        bobber.validateUrl(scm, (result) => {

            expect(result).to.be.false();
            done();
        });
    });

    it('validateUrl mock', (done) => {

        const bobber = new Bobber({ mock: true });
        const scm = {
            type: 'github',
            branch: 'master',
            url: 'https://github.com/fishin/invalid'
        };
        bobber.validateUrl(scm, (result) => {

            expect(result).to.be.true();
            done();
        });
    });
});
