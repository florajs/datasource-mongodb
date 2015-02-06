'use strict';

var mongodb = require('mongodb');

function buildQuery(filter) {
    var or = filter.map(function (andFilters) {
        var and = [];
        andFilters.forEach(function (condition) {
            if (condition.operator === 'equal') {
                var c = {};
                if (typeof condition.value === 'object') {
                    // TODO: check if it really is an array
                    // TODO: field name mapping/escaping?
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

module.exports = function (config) {
    var connections = {};

    var baseUrl = 'mongodb://' + config.server.host + ':' + (config.server.port ? config.server.port : 27017) + '/';

    function getConnection(database, callback) {
        if (connections[database]) return callback(null, connections[database]);

        var url = baseUrl + database + '/';
        console.log('Connecting to mongodb');
        mongodb.MongoClient.connect(url, function(err, db) {
            if (err) return callback(err, null);
            // TODO: implement authentication, reconnect, etc.
            connections[database] = db;
            callback(null, db);
        });
    }

    return {
        process: function (request, callback) {
            var query = (request.filter) ? buildQuery(request.filter) : {};
            var options = {};

            if (request.attributes) {
                options.fields = {};
                request.attributes.forEach(function (a) {
                    // TODO: field name mapping/escaping
                    options.fields[a] = 1;
                });
            }

            if (request.limit) {
                options.limit = request.limit;
            }

            if (request.order) {
                options.sort = request.order.map(function(o) {
                    var attribute = o.attribute; // TODO: field name mapping/escaping
                    var direction = (o.direction === 'desc' ? -1 : 1);
                    return [attribute, direction];
                });
            }

            //console.log(request);
            //console.log(query);
            //console.log(options);

            getConnection(request.database, function (err, db) {
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
        },
        prepare: function () {}
    };
};
