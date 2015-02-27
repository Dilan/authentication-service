var _ = require('lodash'),
    fs = require('fs'),
    configFilePath = __dirname + '/config.prod.json';

module.exports = _.merge(
    {
        http: {
            port: 3008,
            address: '127.0.0.1'
        },
        redis: {
            host: '127.0.0.1',
            port: 6379,
            namespace: { token : 'authentication.token.' },
            ttl: { token: 60 * 60 } // 1 hour
        },
        services: {
            restaurateur: 'http://127.0.0.1:3008'
        }
    },
    fs.existsSync(configFilePath) ? require(configFilePath) : {}
);
