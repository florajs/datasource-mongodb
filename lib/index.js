'use strict';

const mongodb = require('mongodb');

/**
 * @param {Object} filter
 * @returns {Object}
 */
function buildQuery(filter) {
    const or = filter.map(andFilters => {
        const and = [];
        andFilters.forEach(condition => {
            if (condition.operator === 'equal') {
                const c = {};
                if (Array.isArray(condition.value)) {
                    c[condition.attribute] = { $in: condition.value };
                } else if (typeof condition.value === 'object' && !(condition.value instanceof mongodb.ObjectID)) {
                    c[condition.attribute] = { $elemMatch: condition.value };
                } else {
                    c[condition.attribute] = condition.value;
                }
                and.push(c);
            } else if (condition.operator === 'notEqual') {
                const c = {};
                if (Array.isArray(condition.value)) {
                    c[condition.attribute] = { $nin: condition.value };
                } else if (typeof condition.value === 'object' && !(condition.value instanceof mongodb.ObjectID)) {
                    c[condition.attribute] = { $not: condition.value };
                } else {
                    c[condition.attribute] = { $ne: condition.value };
                }
                and.push(c);
            } else if (condition.operator === 'greater') {
                const c = {};
                c[condition.attribute] = { $gt: condition.value };
                and.push(c);
            } else if (condition.operator === 'greaterOrEqual') {
                const c = {};
                c[condition.attribute] = { $gte: condition.value };
                and.push(c);
            } else if (condition.operator === 'less') {
                const c = {};
                c[condition.attribute] = { $lt: condition.value };
                and.push(c);
            } else if (condition.operator === 'lessOrEqual') {
                const c = {};
                c[condition.attribute] = { $lte: condition.value };
                and.push(c);
            }
        });
        return and.length === 1 ? and[0] : { $and: and };
    });
    return or.length === 1 ? or[0] : { $or: or };
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
        this.ObjectID = mongodb.ObjectID;

        if (options.replicaSet) {
            // Set up Replica Set
            if (!options.servers || !Array.isArray(options.servers)) {
                throw new Error('Invalid configuration, need "servers" object if "replicaSet" is set');
            }

            const hasServerAuth = options.servers.reduce((acc, cur) => !!(cur.username && cur.password) || acc, false);

            if (!hasServerAuth && options.username && options.password) {
                this.baseUrl += options.username + ':' + options.password + '@';
            }

            this.baseUrl += options.servers
                .map(server => {
                    if (!server.host) throw new Error('Invalid configuration, missing `host` in servers');
                    let serverUrl = '';
                    if (server.username && server.password) {
                        serverUrl += server.username + ':' + server.password + '@';
                    } else if (hasServerAuth && options.username && options.password) {
                        serverUrl += options.username + ':' + options.password + '@';
                    }
                    serverUrl += server.host + ':' + (server.port || 27017);
                    return serverUrl;
                })
                .join(',');
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
     * @returns {Promise}
     */
    async process(request) {
        const query = request.filter ? buildQuery(request.filter) : {};
        const options = {};

        if (request.attributes) {
            options.projection = {};
            request.attributes.forEach(a => {
                options.projection[a] = 1;
            });
        }

        if (request.limit) {
            options.limit = request.limit;
        }

        if (request.limit && request.page && request.page > 1) {
            options.skip = request.limit * (request.page - 1);
        }

        if (request.order) {
            options.sort = request.order.map(o => {
                const { attribute } = o;
                const direction = o.direction === 'desc' ? -1 : 1;
                return [attribute, direction];
            });
        }

        if (request.search) {
            query.$text = { $search: request.search };
        }

        this.log.trace('Fetching connection for "%s"', request.database);
        const db = await this.getConnection(request.database);
        const collection = await db.collection(request.collection);

        this.log.trace({ query, options }, 'Executing query');
        const data = await collection.find(query, options).toArray();

        this.log.trace({ query, options }, 'Executing count');
        const totalCount = collection.find(query, options).count();

        return { totalCount, data };
    }

    /**
     * @returns {Promise}
     */
    close() {
        return Promise.all(
            Object.keys(this.connections).map(connId => () => {
                this.log.trace('closing MongoDB connection "%s"', connId);
                return this.connections[connId].close();
            })
        );
    }

    /**
     * @param {string} database
     * @returns {Promise}
     * @private
     */
    async getConnection(database) {
        if (this.connections[database]) {
            return this.connections[database].db(database);
        }

        let url = this.baseUrl + database;
        const params = [];
        if (this.ssl) params.push('ssl=' + this.ssl);
        if (this.replicaSet) params.push('replicaSet=' + this.replicaSet);
        if (this.authSource) params.push('authSource=' + this.authSource);
        if (params.length) {
            url += '?' + params.join('&');
        }

        this.log.info(`connecting to MongoDB ${database} on ${url}`);

        const client = await mongodb.MongoClient.connect(
            url,
            { useNewUrlParser: true }
        );
        this.connections[database] = client;
        return client.db(database);
    }
}

module.exports = DataSource;
