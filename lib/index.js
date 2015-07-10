'use strict';

var mongodb = require('mongodb');
var async = require('async');

/**
 * @constructor
 * @param {Api} api
 * @param {Object} options
 */
var DataSource = module.exports = function (api, options) {
    this.log = api.log.child({'component': 'flora-mongodb'});
    this.connections = {};
    this.baseUrl = 'mongodb://' + options.server.host + ':' + (options.server.port ? options.server.port : 27017) + '/';
};

DataSource.prototype.prepare = function () {};

/**
 * @param {Object} request
 * @param {Function} callback
 */
DataSource.prototype.process = function (request, callback) {
    var self = this;

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

    async.waterfall([
        function (next) {
            self.log.trace('Fetching connection for "%s"', request.database);
            self.getConnection(request.database, next);
        },

        function (db, next) {
            self.log.trace('Fetching collection "%s"', request.collection);
            db.collection(request.collection, next);
        },

        function (collection, next) {
            self.log.trace({query: query, options: options}, 'Executing query');
            collection.find(query, options).toArray(next);
        },

        function (docs, next) {
            next(null, {
                totalCount: null,
                data: docs
            });
        }
    ], callback);
};

/**
 * @param {Function} callback
 */
DataSource.prototype.close = function (callback) {
    var self = this;

    async.parallel(Object.keys(this.connections).map(function (connId) {
        return function (next) {
            self.log.trace('closing MongoDB connection "%s"', connId);
            self.connections[connId].close(next);
        };
    }), callback);
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

    this.log.trace('connecting to MongoDB ' + database + ' on ' + url);

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
