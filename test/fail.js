var Code = require('code');
var Lab = require('lab');

//var Demo = require('..');

var internals = {};

var lab = exports.lab = Lab.script();
var expect = Code.expect;
var describe = lab.describe;
var it = lab.it;

describe('demo', function () {

    it('pass test', function (done) {

        expect(false).to.be.true();
        done();
    });
});
