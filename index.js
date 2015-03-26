'use strict';

var mongodb = require('mongodb');

/**
 * @constructor
 * @param {Api} api
 * @param {Object} options
 */
var DataSource = module.exports = function (api, options) {
    this.connections = {};
    this.baseUrl = 'mongodb://' + options.server.host + ':' + (options.server.port ? options.server.port : 27017) + '/';
};

DataSource.prototype.prepare = function () {};

/**
 * @param {Object} request
 * @param {Function} callback
 */
DataSource.prototype.process = function (request, callback) {
    var query = (request.filter) ? buildQuery(request.filter) : {};
    var options = {};

    if (request.attributes) {
        options.fields = {};
        request.attributes.forEach(function (a) {
            options.fields[a] = 1;
        });
    }

    if (request.limit) {
        options.limit = request.limit;
    }

    if (request.order) {
        options.sort = request.order.map(function(o) {
            var attribute = o.attribute; // FIXME: field name mapping
            var direction = (o.direction === 'desc' ? -1 : 1);
            return [attribute, direction];
        });
    }

    this.getConnection(request.database, function (err, db) {
        if (err) return callback(err, null);
        db.collection(request.collection, function onCollection(err, collection) {
            if (err) return callback(err, null);
            collection.find(query, options).toArray(function (err, docs) {
                if (err) return callback(err, null);
                callback(null, {
                    totalCount: null,
                    data: docs
                });
            });
        });
    });
};

/**
 * @param {Function} callback
 */
DataSource.prototype.close = function (callback) {
    // TODO: implement
    if (callback) callback();
};

/**
 * @param {string} database
 * @param {Function} callback
 * @private
 */
DataSource.prototype.getConnection = function (database, callback) {
    if (this.connections[database]) return callback(null, this.connections[database]);

    var self = this;
    var url = this.baseUrl + database + '/';
    console.log('Connecting to mongodb');
    mongodb.MongoClient.connect(url, function(err, db) {
        if (err) return callback(err, null);
        // TODO: implement authentication, reconnect, etc.
        self.connections[database] = db;
        callback(null, db);
    });
};

/**
 * @param {Object} filter
 * @returns {Object}
 */
function buildQuery(filter) {
    var or = filter.map(function (andFilters) {
        var and = [];
        andFilters.forEach(function (condition) {
            if (condition.operator === 'equal') {
                var c = {};
                if (typeof condition.value === 'object') {
                    // TODO: check if it really is an array
                    // TODO: field name mapping
                    // TODO: type casting?
                    c[condition.attribute] = {'$in': condition.value};
                } else {
                    c[condition.attribute] = condition.value;
                }
                and.push(c);
            }
        });
        return (and.length === 1) ? and[0] : {'$and': and};
    });
    return (or.length === 1) ? or[0] : {'$or': or};
}
