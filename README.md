# Flora MongoDB-DataSource

MongoDB connector for [Flora](https://github.com/godmodelabs/flora).

This is a very early status of implementation and prone to change in the future.

## Usage

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

## Known Issues

Currently, authentication and reconnect is not supported.

## License

MIT
