# flora-mongodb

![](https://github.com/godmodelabs/flora-mongodb/workflows/ci/badge.svg)
[![NPM version](https://img.shields.io/npm/v/flora-mongodb.svg?style=flat)](https://www.npmjs.com/package/flora-mongodb)
[![NPM downloads](https://img.shields.io/npm/dm/flora-mongodb.svg?style=flat)](https://www.npmjs.com/package/flora-mongodb)

MongoDB data source for [Flora](https://github.com/godmodelabs/flora).

## Usage

### Configuration

The module has to be added to a Flora config file by using the `dataSources` object.

```js
module.exports = {
    …
    dataSources: {
        mongodb: {
            constructor: require('flora-mongodb'),
                options: {
                    server: {
                        host: 'localhost',
                        port: 27017
                    },
                },
            },
        },
        …
};
```

Alternatively, a Replica Set can be used:

```js
module.exports = {
    …
    dataSources: {
        mongodb: {
            constructor: require('flora-mongodb'),
                options: {
                    replicaSet: 'mycluster',
                    servers: [
                        { host: 'mongo-1', port: 27017 },
                        { host: 'mongo-2', port: 27017 },
                    ],
                },
            },
        },
        …
};
```

Other additional options:

```js
module.exports = {
    …
    dataSources: {
        mongodb: {
            constructor: require('flora-mongodb'),
                options: {
                    ssl: true,
                    authSource: 'admin',
                    server: {
                        host: 'localhost',
                        port: 27017
                    },
                    username: 'dbuser',
                    password: 'dbpassword',
                },
            },
        },
        …
};
```

### Resources

Given you want to use the database "mydatabase" on the host configured above. To map "mycollection" to a resource, the following XML can be used:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resource primaryKey="id" xmlns:flora="urn:flora:options">
    <flora:dataSource type="mongodb" database="mydatabase" collection="mycollection"/>
    <id type="int" storedType="string" map="user" order="true"/>
    <data type="raw"/>
</resource>
```

Objects in the database look like this (storedType is used to convert the numerical "id" to the string representation in the database):

```js
{
    id: '123456',
    data: {
        someKey: 'someValue',
        someOtherKey: {
            foo: 'bar',
            ...
        }
    }
}
```

## License

[MIT](LICENSE)
