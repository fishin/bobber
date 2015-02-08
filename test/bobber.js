var Code = require('code');
var Fs = require('fs');
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

        var pail = new Pail({dirPath: bobberPath});
        var config = pail.createPail({name: 'checkoutCode'});
        
        pail.createDir(config.id + '/workspace');
        var scm = {
            type: 'github',
            branch: 'master',
            url: 'https://github.com/fishin/bobber'
        };
        var bobber = new Bobber;
        var result = bobber.checkoutCode(bobberPath+'/'+config.id+'/workspace', scm);
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
        var bobber = new Bobber;
        var pail = new Pail({dirPath: bobberPath});
        var pails = pail.getPails();
        var config = pail.getPail(pails[0]);
        var result = bobber.checkoutCode(bobberPath+'/'+config.id+'/workspace', scm);
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

        var bobber = new Bobber;
        var elements = bobber.getElements();
        //console.log(elements);
        expect(elements).to.be.length(2);
        done();
    });

    it('getAllCommits none', function (done) {

        var bobber = new Bobber;
        // get commits for this repo
        var commits = bobber.getAllCommits('/tmp');
        expect(commits.length).to.equal(0);
        done();
    });

    it('getAllCommits', function (done) {

        var bobber = new Bobber;
        // get commits for this repo
        var commits = bobber.getAllCommits('.');
        expect(commits.length).to.above(0);
        done();
    });

    it('getLatestCommit', function (done) {

        var bobber = new Bobber;
        // get commits for this repo
        var commit = bobber.getLatestCommit('.');
        expect(commit.length).to.equal(40);
        done();
    });

    it('getBranches', function (done) {

        var bobber = new Bobber;
        // get commits for this repo
        var branches = bobber.getBranches('.');
        //console.log(branches);
        expect(branches.length).to.above(0);
        done();
    });

    it('getCompareCommits', function (done) {

        var bobber = new Bobber;
        // get commits for this repo
        var commits = bobber.getAllCommits('.');
        var prevCommit = commits[1].commit;
        var commitsCompare = bobber.getCompareCommits('.', commits[0].commit, commits[1].commit);
        expect(commitsCompare.length).to.equal(1);
        done();
    });

    it('validUrl ssh', function (done) {

        var bobber = new Bobber;
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

        var bobber = new Bobber;
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

        var bobber = new Bobber;
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
