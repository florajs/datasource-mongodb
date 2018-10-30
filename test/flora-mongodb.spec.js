/* global describe, it */

'use strict';

const { expect } = require('chai');
const bunyan = require('bunyan');

const DataSource = require('../');

const log = bunyan.createLogger({ name: 'null', streams: [] });

// mock Api instance
const api = { log };

describe('flora-mongodb', () => {
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
