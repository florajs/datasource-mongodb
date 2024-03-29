# Deprecated

This project is deprecated and is no longer being maintained.

# @florajs/datasource-mongodb

MongoDB data source for [Flora](https://github.com/florajs/flora).

## Usage

### Configuration

The module has to be added to a Flora config file by using the `dataSources` object.

```js
module.exports = {
    …
    dataSources: {
        mongodb: {
            constructor: require('@florajs/datasource-mongodb'),
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
            constructor: require('@florajs/datasource-mongodb'),
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
            constructor: require('@florajs/datasource-mongodb'),
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

### Known issue when using ObjectID as primary key

Due to the flora module currently lacking data source specific type casting, it is needed to convert IDs to ObjectIDs **when using ObjectIDs as primary keys**:

```js
module.exports = (api) => ({
    extensions: {
        preExecute: ({ request }) => {
            // Replace values for "_id" with ObjectID in filters
            if (request.type === 'mongodb' && request.filter) {
                const dataSource = api.dataSources[request.type];

                request.filter.forEach((andFilters) => {
                    andFilters.forEach((condition) => {
                        if (condition.attribute === '_id') {
                            if (Array.isArray(condition.value)) {
                                condition.value = condition.value.map((value) => dataSource.ObjectID(value));
                            } else {
                                condition.value = dataSource.ObjectID(condition.value);
                            }
                        }
                    });
                });
            }
        },
    },
    …
});
```




## License

[MIT](LICENSE)
