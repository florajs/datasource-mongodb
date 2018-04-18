'use strict';

const mongodb = require('mongodb');
const async = require('async');

/**
 * @param {Object} filter
 * @returns {Object}
 */
function buildQuery(filter) {
    const or = filter.map((andFilters) => {
        const and = [];
        andFilters.forEach((condition) => {
            if (condition.operator === 'equal') {
                const c = {};
                if (Array.isArray(condition.value)) {
                    c[condition.attribute] = { $in: condition.value };
                } else {
                    c[condition.attribute] = condition.value;
                }
                and.push(c);
            }
        });
        return (and.length === 1) ? and[0] : { $and: and };
    });
    return (or.length === 1) ? or[0] : { $or: or };
}

class DataSource {
    /**
     * @param {Api} api
     * @param {Object} options
     */
    constructor(api, options) {
        this.log = api.log.child({ component: 'flora-mongodb' });
        this.connections = {};

        this.ssl = false;
        this.replicaSet = null;
        this.authSource = null;
        this.baseUrl = 'mongodb://';

        if (options.replicaSet) {
            // Set up Replica Set
            if (!options.servers || !Array.isArray(options.servers)) {
                throw new Error('Invalid configuration, need "servers" object if "replicaSet" is set');
            }

            const hasServerAuth = options.servers.reduce(
                (acc, cur) => !!(cur.username && cur.password) || acc, false);

            if (!hasServerAuth && options.username && options.password) {
                this.baseUrl += options.username + ':' + options.password + '@';
            }

            this.baseUrl += options.servers.map((server) => {
                if (!server.host) throw new Error('Invalid configuration, missing `host` in servers');
                let serverUrl = '';
                if (server.username && server.password) {
                    serverUrl += server.username + ':' + server.password + '@';
                } else if (hasServerAuth && options.username && options.password) {
                    serverUrl += options.username + ':' + options.password + '@';
                }
                serverUrl += server.host + ':' + (server.port || 27017);
                return serverUrl;
            }).join(',');
            this.baseUrl += '/';
            this.ssl = !!options.ssl;
            this.replicaSet = options.replicaSet;
            this.authSource = options.authSource;
        } else {
            // Set up single server
            if (!options.server) throw new Error('Invalid configuration, missing `server`');
            if (!options.server.host) throw new Error('Invalid configuration, missing `host` property in server');
            if (options.username && options.password) this.baseUrl += options.username + ':' + options.password + '@';
            this.baseUrl += options.server.host + ':' + (options.server.port || 27017) + '/';
        }
    }

    prepare() {}

    /**
     * @param {Object} request
     * @param {Function} callback
     */
    process(request, callback) {
        const query = (request.filter) ? buildQuery(request.filter) : {};
        const options = {};

        if (request.attributes) {
            options.fields = {};
            request.attributes.forEach((a) => {
                options.fields[a] = 1;
            });
        }

        if (request.limit) {
            options.limit = request.limit;
        }

        if (request.limit && request.page && request.page > 1) {
            options.skip = request.limit * (request.page - 1);
        }

        if (request.order) {
            options.sort = request.order.map((o) => {
                const attribute = o.attribute;
                const direction = (o.direction === 'desc' ? -1 : 1);
                return [attribute, direction];
            });
        }

        async.waterfall([
            (next) => {
                this.log.trace('Fetching connection for "%s"', request.database);
                this.getConnection(request.database, next);
            },

            (db, next) => {
                this.log.trace('Fetching collection "%s"', request.collection);
                db.collection(request.collection, next);
            },

            (collection, next) => {
                this.log.trace({ query, options }, 'Executing query');
                collection.find(query, options).toArray(next);
            },

            (docs, next) => {
                next(null, {
                    totalCount: null,
                    data: docs
                });
            }
        ], callback);
    }

    /**
     * @param {Function} callback
     */
    close(callback) {
        async.parallel(Object.keys(this.connections).map(connId =>
            (next) => {
                this.log.trace('closing MongoDB connection "%s"', connId);
                this.connections[connId].close(next);
            }
        ), callback);
    }

    /**
     * @param {string} database
     * @param {Function} callback
     * @private
     */
    getConnection(database, callback) {
        if (this.connections[database]) return callback(null, this.connections[database]);

        let url = this.baseUrl + database;
        const params = [];
        if (this.ssl) params.push('ssl=' + this.ssl);
        if (this.replicaSet) params.push('replicaSet=' + this.replicaSet);
        if (this.authSource) params.push('authSource=' + this.authSource);
        if (params.length) { url += '?' + params.join('&'); }

        this.log.info(`connecting to MongoDB ${database} on ${url}`);

        return mongodb.MongoClient.connect(url, (err, db) => {
            if (err) return callback(err, null);
            this.connections[database] = db;
            return callback(null, db);
        });
    }
}

module.exports = DataSource;
