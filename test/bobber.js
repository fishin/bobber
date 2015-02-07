var Code = require('code');
var Fs = require('fs');
var Lab = require('lab');
var Path = require('path');

var Bobber = require('../lib');

var internals = {};

var lab = exports.lab = Lab.script();
var expect = Code.expect;
var describe = lab.describe;
var it = lab.it;

var bobberPath = 'tmp';

describe('bobber', function () {

    it('getCheckoutCommand new', function (done) {
        Fs.mkdirSync(bobberPath);
        var scm = {
            type: 'github',
            branch: 'master',
            url: 'https://github.com/fishin/bobber'
        };
        var bobber = new Bobber;
        var commands = bobber.getCheckoutCommands(bobberPath, scm);
        Fs.rmdirSync(bobberPath);
        //expect(commands).to.include([ 'git clone --depth=50 --branch=master https://github.com/fishin/bobber .' ]);
        expect(commands).to.include([ 'git clone --branch=master https://github.com/fishin/bobber .' ]);
        done();
    });

    it('getCheckoutCommand existing', function (done) {

        var gitPath = Path.join(bobberPath, '.git');
        Fs.mkdirSync(bobberPath);
        Fs.mkdirSync(gitPath);
        var scm = {
            type: 'github',
            branch: 'master',
            url: 'git@github.com:fishin/bobber'
        };
        var bobber = new Bobber;
        var commands = bobber.getCheckoutCommands(bobberPath, scm);
        Fs.rmdirSync(gitPath);
        Fs.rmdirSync(bobberPath);
        //expect(commands).to.include([ 'git pull --depth=50 origin master' ]);
        expect(commands).to.include([ 'git pull origin master' ]);
        done();
    });

    it('getElements', function (done) {

        var bobber = new Bobber;
        var elements = bobber.getElements();
        //console.log(elements);
        expect(elements).to.be.length(2);
        done();
    });

    it('getCommits none', function (done) {

        var bobber = new Bobber;
        // get commits for this repo
        var commits = bobber.getCommits('/tmp', null);
        expect(commits.length).to.equal(0);
        done();
    });

    it('getCommits', function (done) {

        var bobber = new Bobber;
        // get commits for this repo
        var commits = bobber.getCommits('.', null);
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
});
