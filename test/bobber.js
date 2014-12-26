var Code = require('code');
var Fs = require('fs');
var Lab = require('lab');
var Bobber = require('../lib');
var Path = require('path');

var internals = {};

var lab = exports.lab = Lab.script();
var expect = Code.expect;
var describe = lab.describe;
var it = lab.it;

var bobberPath = '/tmp/testbobber';

describe('bobber', function () {

    it('getCheckoutCommand new', function (done) {
        Fs.mkdirSync(bobberPath);
        var scm = { type: 'github',
                    branch: 'master',
                    url: 'https://github.com/fishin/bobber'
        };
        var bobber = new Bobber;
        var command = bobber.getCheckoutCommand(bobberPath, scm);
        Fs.rmdirSync(bobberPath);
        expect(command).to.contain('git clone --depth=50 --branch=master https://github.com/fishin/bobber .');
        done();
    });

    it('getCheckoutCommand existing', function (done) {

        var gitPath = Path.join(bobberPath, '.git');
        Fs.mkdirSync(bobberPath);
        Fs.mkdirSync(gitPath);
        var scm = { type: 'github',
                    branch: 'master',
                    url: 'git@github.com:fishin/bobber'
        };
        var bobber = new Bobber;
        var command = bobber.getCheckoutCommand(bobberPath, scm);
        Fs.rmdirSync(gitPath);
        Fs.rmdirSync(bobberPath);
        expect(command).to.contain('git pull --depth=50 origin master');
        done();
    });

    it('getElements', function (done) {

        var bobber = new Bobber;
        var elements = bobber.getElements();
        //console.log(elements);
        expect(elements).to.be.length(2);
        done();
    });

});
