var Fs = require('fs');
var Hapi = require('hapi');
var Lab = require('lab');
var Bobber = require('../lib');
var Path = require('path');

var internals = {};

var lab = exports.lab = Lab.script();
var expect = Lab.expect;
var before = lab.before;
var after = lab.after;
var describe = lab.describe;
var it = lab.it;

var bobberPath = '/tmp/bobber';

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
        expect(command).to.contain('git clone -q --branch=master https://github.com/fishin/bobber .');
        done();
    });

    it('getCheckoutCommand existing', function (done) {

        var gitPath = Path.join(bobberPath, '.git');
        Fs.mkdirSync(bobberPath);
        Fs.mkdirSync(gitPath);
        var scm = { type: 'github',
                    branch: 'origin/master',
                    url: 'git@github.com:fishin/bobber'
        };
        var bobber = new Bobber;
        var command = bobber.getCheckoutCommand(bobberPath, scm);
        Fs.rmdirSync(gitPath);
        Fs.rmdirSync(bobberPath);
        expect(command).to.contain('git pull');
        done();
    });

});
