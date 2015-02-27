module.exports = function(app, core) {
    var tokensRoutes = require('./tokens')(core);

    app.post('/', tokensRoutes.authByCodeAndGenerateToken);
    app.put('/tokens', tokensRoutes.findTokenAndUpdateTtl);

    // restaurateur service
    app.get('/auth/:authCode', function(req, res) {
        return res.json({
            id: 'fake-restaurant'
        });
    });
    app.get('/restaurants/:restaurantId/tables', function(req, res) {
        return res.json({
            items: [
                { id: '1', internalId: '1001', description: 'Table 1001 near the door.' },
                { id: '2', internalId: '1002', description: 'Table 1002 near the WC.' }
            ]
        });
    });
};
