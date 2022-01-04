'use strict';

const { expect } = require('chai');
const nullLogger = require('abstract-logging');

const DataSource = require('../lib');

const log = nullLogger;
log.child = () => log;

// mock Api instance
const api = { log };

describe('datasource-mongodb', () => {
    const config = {
        server: {
            host: 'localhost',
            port: '27027'
        }
    };

    it('should be a function', () => {
        expect(DataSource).to.be.a('function');
    });

    it('should be instantiable', () => {
        expect(new DataSource(api, config)).to.be.an('object');
    });

    it('should expose "prepare" and "process" functions', () => {
        const ds = new DataSource(api, config);
        expect(ds).to.have.property('prepare');
        expect(ds.prepare).to.be.a('function');
        expect(ds).to.have.property('process');
        expect(ds.process).to.be.a('function');
    });
});
