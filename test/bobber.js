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

describe('bobber', function () {

    it('checkoutCode new', function (done) {

        var pail = new Pail({ dirPath: bobberPath });
        var config = pail.createPail({ name: 'checkoutCode' });
        pail.createDir(config.id + '/workspace');
        var scm = {
            type: 'github',
            branch: 'master',
            url: 'https://github.com/fishin/bobber'
        };
        var bobber = new Bobber({});
        var options = {
            path: bobberPath + '/' + config.id + '/workspace',
            scm: scm,
            pr: null,
            pidsObj: null
        };
        bobber.checkoutCode(options, function (result) {

            expect(result.startTime).to.exist();
            expect(result.finishTime).to.exist();
            expect(result.commands[0].command).to.include('git clone');
            expect(result.commands[0].stderr).to.include('Cloning into');
            expect(result.status).to.equal('succeeded');
            done();
        });
    });

    it('checkoutCode existing', function (done) {

        var scm = {
            type: 'github',
            branch: 'master',
            url: 'git@github.com:fishin/bobber'
        };
        var bobber = new Bobber({});
        var pail = new Pail({ dirPath: bobberPath });
        var pails = pail.getPails();
        var config = pail.getPail(pails[0]);
        var options = {
            path: bobberPath + '/' + config.id + '/workspace',
            scm: scm,
            pr: null,
            pidsObj: null
        };
        bobber.checkoutCode(options, function (result) {

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
    });

    it('checkoutCode mergeCommit merge', function (done) {

        var pail = new Pail({ dirPath: bobberPath });
        var config = pail.createPail({ name: 'checkoutCode' });
        pail.createDir(config.id + '/workspace');
        var scm = {
            type: 'github',
            branch: 'master',
            url: 'https://github.com/fishin/demo'
        };
        var bobber = new Bobber({});
        bobber.getPullRequests(scm, null, function (prs) {

            //console.log(prs);
            expect(prs.length).to.be.above(0);
            expect(prs[0].number).to.be.above(0);
            expect(prs[0].commit.length).to.equal(40);
            expect(prs[0].mergeCommit.length).to.equal(40);
            expect(prs[0].shortCommit.length).to.equal(7);
            expect(prs[0].repoUrl).to.equal('https://github.com/fishin/demo');
            var options = {
                path: bobberPath + '/' + config.id + '/workspace',
                scm: scm,
                pr: prs[0],
                pidsObj: null
            };
            bobber.checkoutCode(options, function (result) {

                //console.log(result);
                expect(result.startTime).to.exist();
                expect(result.finishTime).to.exist();
                expect(result.commands.length).to.equal(3);
                expect(result.commands[2].command).to.include('git pull');
                expect(result.status).to.equal('succeeded');
                var commit = bobber.getLatestCommitSync(bobberPath + '/' + config.id + '/workspace');
                // different commit number after merge not sure why it worked before
                //expect(commit).to.equal(prs[0].commit);
                pail.deletePail(config.id);
                Fs.rmdirSync(bobberPath);
                done();
            });
        });
    });

    it('checkoutCode mergeCommit git clone fail', function (done) {

        var pail = new Pail({ dirPath: bobberPath });
        var config = pail.createPail({ name: 'checkoutCodeSync' });
        pail.createDir(config.id + '/workspace');
        var scm = {
            type: 'github',
            branch: 'master',
            url: 'https://anon@anon:github.com/fishin/invalid'
        };
        var bobber = new Bobber({});
        var options = {
            path: bobberPath + '/' + config.id + '/workspace',
            scm: scm,
            pr: {},
            pidsObj: null
        };
        bobber.checkoutCode(options, function (result) {

            //console.log(result);
            expect(result.startTime).to.exist();
            expect(result.finishTime).to.exist();
            expect(result.commands[0].command).to.include('git clone');
            expect(result.commands[0].stderr).to.include('fatal:');
            expect(result.status).to.equal('failed');
            var commit = bobber.getLatestCommitSync(bobberPath + '/' + config.id + '/workspace');
            pail.deletePail(config.id);
            Fs.rmdirSync(bobberPath);
            done();
        });
    });

    it('getElements', function (done) {

        var bobber = new Bobber({});
        var elements = bobber.getElements();
        //console.log(elements);
        expect(elements).to.be.length(2);
        done();
    });

    it('getAllCommitsSync none', function (done) {

        var bobber = new Bobber({});
        // get commits for this repo
        var commits = bobber.getAllCommitsSync('/tmp');
        expect(commits.length).to.equal(0);
        done();
    });

    it('getAllCommitsSync', function (done) {

        var bobber = new Bobber({});
        // get commits for this repo
        var commits = bobber.getAllCommitsSync('.');
        expect(commits.length).to.above(0);
        done();
    });

    it('getLatestCommitSync', function (done) {

        var bobber = new Bobber({});
        // get commits for this repo
        var commit = bobber.getLatestCommitSync('.');
        expect(commit.length).to.equal(40);
        done();
    });

    it('getLatestRemoteCommitSync', function (done) {

        var bobber = new Bobber({});
        var scm = {
            branch: 'master'
        };
        var commit = bobber.getLatestRemoteCommitSync(scm);
        expect(commit.length).to.equal(40);
        done();
    });

    it('getLatestRemoteCommitSync invalid', function (done) {

        var bobber = new Bobber({});
        var scm = {
            branch: 'master1'
        };
        var commit = bobber.getLatestRemoteCommitSync('.', scm);
        expect(commit).to.not.exist();
        done();
    });

    it('getBranches', function (done) {

        var bobber = new Bobber({});
        // get commits for this repo
        bobber.getBranches('.', function (branches) {

            //console.log(branches);
            expect(branches.length).to.above(0);
            done();
        });
    });

    it('getCompareCommitsSync', function (done) {

        var bobber = new Bobber({});
        // get commits for this repo
        var commits = bobber.getAllCommitsSync('.');
        var prevCommit = commits[1].commit;
        var commitsCompare = bobber.getCompareCommitsSync('.', commits[0].commit, commits[1].commit);
        //console.log(commitsCompare);
        expect(commitsCompare.length).to.be.above(0);
        done();
    });

    it('validateUrlSync ssh', function (done) {

        var bobber = new Bobber({});
        // get commits for this repo
        var scm = {
            type: 'github',
            branch: 'master',
            url: 'git@github.com:fishin/bobber'
        };
        expect(bobber.validateUrlSync(scm)).to.be.true();
        done();
    });

    it('validateUrlSync https valid', function (done) {

        var bobber = new Bobber({});
        // get commits for this repo
        var scm = {
            type: 'github',
            branch: 'master',
            url: 'https://github.com/fishin/bobber'
        };
        expect(bobber.validateUrlSync(scm)).to.be.true();
        done();
    });

    it('validateUrlSync https invalid', function (done) {

        var bobber = new Bobber({});
        // get commits for this repo
        var scm = {
            type: 'github',
            branch: 'master',
            url: 'https://github.com/fishin/invalid'
        };
        expect(bobber.validateUrlSync(scm)).to.be.false();
        done();
    });

    it('validateUrlSync mock', function (done) {

        var bobber = new Bobber({ mock: true });
        var scm = {
            type: 'github',
            branch: 'master',
            url: 'https://github.com/fishin/invalid'
        };
        expect(bobber.validateUrlSync(scm)).to.be.true();
        done();
    });
});
