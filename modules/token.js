var _ = require('lodash'),
    uuid = require('node-uuid'),
    when = require('when');

module.exports = function(core) {
    var redisClient = core.redis.client;

    var findByKey = function(key) {
            return core.redis.api.get(key);
        },

        create = function(namespace, value, ttl) {
            var token = uuid.v4();
            redisClient.set(redisKey(namespace, token), value, 'EX', ttl);
            return token;
        },

        redisKey = function(namespace, token) {
            return namespace + token;
        },

        changeTtl = function(key, sec) {
            redisClient.expire(key, sec);
        };

    return {
        redisKey: redisKey,
        findByKey: findByKey,
        create: create,
        changeTtl: changeTtl
    };
};
