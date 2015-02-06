'use strict';

var expect = require('chai').expect;

var floraCluster = require('../');

describe('flora-mongodb', function () {
    var config = {
        server: {
            host: 'localhost',
            port: '27027'
        }
    };

    it('should be a function', function () {
        expect(floraCluster).to.be.a('function');
    });

    it('should return an object', function () {
        expect(floraCluster(config)).to.be.an('object'); 
    });

    it('should expose "prepare" and "process" functions', function () {
        expect(floraCluster(config)).to.have.property('prepare');
        expect(floraCluster(config).prepare).to.be.a('function');
        expect(floraCluster(config)).to.have.property('process');
        expect(floraCluster(config).process).to.be.a('function');
    });
});
