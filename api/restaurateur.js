module.exports = function(core) {
    var request = require('request');

    var commonResponse = function(callback) {
        var toJson = function(str) {
                try {
                    return JSON.parse(str);
                } catch (e) {
                    return e;
                }
            };

        return function(err, response, body) {
            var jsonData = toJson(body);

            if (!err && response.statusCode === 200 && (jsonData instanceof Error) === false ) {
                return callback(null, jsonData);
            }

            if (err) {
                err.httpCode = 500;
            } else if ((jsonData instanceof Error) === true) {
                err = new Error('Invalid JSON provided');
                err.httpCode = 400;
            } else {
                var jsonBody = JSON.parse(body);
                err = new Error(
                    (typeof jsonBody.message !== 'undefined' ) ?
                        jsonBody.message : 'Unexpected JSON : ' + body
                );
                err.httpCode = response.statusCode;
            }
            return callback(err);
        };
    };

    return {
        getRestaurantByAuthCode: function(authCode, callback) {
            var url = [
                core.config.services.restaurateur,
                'auth',
                encodeURIComponent(authCode)
            ].join('/');

            request.get({ uri: url }, commonResponse(callback));
        },

        getTablesByRestaurantId: function(restaurantId, callback) {
            var url = [
                core.config.services.restaurateur,
                'restaurants',
                encodeURIComponent(restaurantId),
                'tables'
            ].join('/');

            request.get({ uri: url }, commonResponse(callback));
        }
    };
};
