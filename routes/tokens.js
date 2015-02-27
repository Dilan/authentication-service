var _ = require('lodash'),
    when = require('when'),
    async = require('async');

module.exports = function(core) {
    var logger = core.getLogger('[routes.token]'),
        mm = core.modulesManager;

    return {
        authByCodeAndGenerateToken: function(req, res) {
            var authCode = req.body.authCode,
                restaurateurService = core.modulesManager.get('api.restaurateur');

            async.waterfall([
                // find restaurant by AuthCode
                function(callback) {
                    restaurateurService.getRestaurantByAuthCode(authCode, callback);
                },
                // fetch tables for restaurant and inject to restaurant object
                function(restaurant, callback) {
                    console.log(restaurant);
                    restaurateurService.getTablesByRestaurantId(
                        restaurant.id,
                        function(err, tables) {
                            restaurant.tables = tables.items;
                            callback(err, restaurant);
                        }
                    );
                }

            ], function(err, restaurant) {
                if (err) {
                    return res.status((err.httpCode ? err.httpCode : 400)).json(
                        {
                            'error': true,
                            'errorCode': err.code,
                            'errorMsg': err.message
                        }
                    );
                }

                var token = mm.get('token').create(
                    // namespace
                    core.redis.namespace.token,
                    // value
                    JSON.stringify({ restaurantId: restaurant.id }),
                    // ttl
                    core.config.redis.ttl.token
                );

                return res.json({
                    error: false,
                    token: token,
                    restaurantId: restaurant.id,
                    tables: restaurant.tables
                });
            });
        },

        findTokenAndUpdateTtl: function(req, res) {
            var token = req.body.token,
                key = mm.get('token').redisKey(core.redis.namespace.token, token);

            when(mm.get('token').findByKey(key))
                .then(function(value) {
                    if (!value) {
                        return res.status(400).json(
                            { 'error': true, 'errorCode': '400', 'errorMsg': 'Token not found.' }
                        );
                    }
                    mm.get('token').changeTtl(key, core.config.redis.ttl.token);

                    var json = JSON.parse(value);
                    return res.json({ error: false, token: token, restaurantId: json.restaurantId });
                }).catch(function(err) {
                    logger.error(err);
                    return res.status(501).json(
                        { 'error': true, 'errorCode': '500', 'errorMsg': 'Unexpected error.' }
                    );
                });
        }
    };
};
