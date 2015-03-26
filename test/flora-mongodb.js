'use strict';

var expect = require('chai').expect;
var bunyan = require('bunyan');
var DataSource = require('../');

var log = bunyan.createLogger({name: 'null', streams: []});

// mock Api instance
var api = {
    log: log
};

describe('flora-mongodb', function () {
    var config = {
        server: {
            host: 'localhost',
            port: '27027'
        }
    };

    it('should be a function', function () {
        expect(DataSource).to.be.a('function');
    });

    it('should be instantiable', function () {
        expect(new DataSource(api, config)).to.be.an('object'); 
    });

    it('should expose "prepare" and "process" functions', function () {
        var ds = new DataSource(api, config);
        expect(ds).to.have.property('prepare');
        expect(ds.prepare).to.be.a('function');
        expect(ds).to.have.property('process');
        expect(ds.process).to.be.a('function');
    });
});
