module.exports = function(basePath) {
    return {
        resolve: function(moduleName) {
            switch (moduleName) {
                case 'api.restaurateur':
                    return basePath + '/api/restaurateur';
                case 'token':
                    return basePath + '/modules/token';
            }
        }
    };
};
