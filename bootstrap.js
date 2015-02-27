module.exports.shared = function() {
    var basePath = __dirname,
        config = require(basePath + '/config/'),
        resolveModulePath = require('./module_paths')(basePath).resolve,

        shared = {
            abort: module.exports.abort,
            config: config,
            basePath: basePath,
            getLogger: function(namespace) {
                return {
                    error: function(message) {
                        console.error(message);
                    },
                    debug: function(message) {
                        console.log(message);
                    }
                };
            },
            modulesManager: {
                cachedModules: {},
                get: function(moduleName) {
                    if (typeof this.cachedModules[moduleName] === 'undefined') {
                        var m = require(resolveModulePath(moduleName));
                        this.cachedModules[moduleName] = (typeof m === 'function' ? m(shared) : m);
                    }
                    return this.cachedModules[moduleName];
                }
            }
        };

    return shared;
};

module.exports.redis = function(shared) {
    var when = require('when'),
        logger = shared.getLogger('bootstrap.redis'),
        config = shared.config,
        client = require('redis').createClient(config.redis.port, config.redis.host);

    client.on('error', function(err) {
        logger.error(err);
    });

    client.on('reconnecting', function() {
        logger.debug('reconnecting ...');
    });

    client.on('connect', function() {
        logger.debug('Successfully connected to Redis');
    });

    return shared.redis = {
        namespace: config.redis.namespace,
        client: client,
        api: {
            get: function(key) {
                var deferred = when.defer();
                client.get(key, function(err, value) {
                    if (err) {
                        deferred.reject(err);
                    } else {
                        deferred.resolve(value);
                    }
                });
                return deferred.promise;
            },
            del: function(key) {
                var deferred = when.defer();
                client.del(key, function(err) {
                    if (err) {
                        deferred.reject(new Error(err.message));
                    } else {
                        deferred.resolve();
                    }
                });
                return deferred.promise;
            }
        }
    };
};

module.exports.express = function(shared) {
    var _ = require('lodash'),
        app = require('express')();

    shared.app = app;

    // middleware
    var bodyParser = require('body-parser');
    app.use(bodyParser.json());

    app.use(function(req, res, next) {
        shared.getLogger('[bootstrap.express]').debug(
            '[' + req.method + ' ' + req.url + ']' +
            (req.method !== 'GET' ? ' ' + _.isObject(req.body) ? JSON.stringify(req.body) : req.body : '')
        );
        next();
    });

    // routes
    require('./routes/')(app, shared);

    return app;
};

module.exports.http = function(shared) {
    var logger = shared.getLogger('[bootstrap.http]');

    return require('http').createServer(shared.app)
        .on('listening', function() {
            logger.debug('Express server listening on port ' + shared.config.http.port);
        })
        .on('error', function(error) {
            logger.error('error while starting HTTP server');
            logger.error(error);
        })
        .listen(shared.config.http.port, shared.config.http.address);
};
