Flora MongoDB DataSource
========================

[![Build Status](https://travis-ci.org/godmodelabs/flora-mongodb.svg?branch=master)](https://travis-ci.org/godmodelabs/flora-mongodb)
[![NPM version](https://badge.fury.io/js/flora-mongodb.svg)](https://www.npmjs.com/package/flora-mongodb)
[![Dependencies](https://img.shields.io/david/godmodelabs/flora-mongodb.svg)](https://david-dm.org/godmodelabs/flora-mongodb)

MongoDB connection for [Flora](https://github.com/godmodelabs/flora).

This is a very early status of implementation and prone to change in the future.

Usage
-----

### Configuration

The module has to be added to a Flora config file by using the `dataSources` object.

```
'dataSources': {
    ...
    'mongodb': {
        'constructor': require('flora-mongodb'),
            'options': {
                'server': {
                    'host': 'localhost',
                    'port': 27017
                }
            }
        }
    }
    ...
}
```

Alternatively, a Replica Set can be used:

```
'dataSources': {
    ...
    'mongodb': {
        'constructor': require('flora-mongodb'),
            'options': {
                'replicaSet': 'mycluster',
                'servers': [
                    {'host': 'mongo-1', 'port': 27017},
                    {'host': 'mongo-2', 'port': 27017}
                ]
            }
        }
    }
    ...
}
```

Authentication can be done:

```
'dataSources': {
    ...
    'mongodb': {
        'constructor': require('flora-mongodb'),
            'options': {
                server': {
                    'host': 'localhost',
                    'port': 27017
                },
                'username': 'dbuser',
                'password': 'dbpassword'
            }
        }
    }
    ...
}
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

```json
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


License
-------

[MIT](LICENSE)
