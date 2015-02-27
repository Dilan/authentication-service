var _ = require('lodash'),
    when = require('when'),
    request = require('request'),
    uuid = require('node-uuid'),
    specialRequest = require('supertest'),
    sinon = require('sinon'),
    should = require('should');

var basePath = global.basePath,
    bootstrap = require(basePath + '/bootstrap'),
    shared = bootstrap.shared(),
    app = bootstrap.express(shared),
    mm = shared.modulesManager;

describe('Token routing integration tests:', function() {

    before(function(done) {
        when(bootstrap.redis(shared)).then(function() {
            done();
        });
    });

    afterEach(function(done) {
        shared.redis.api.del(shared.config.redis.namespace.token + 'xxxx-xxxx-xxxx-xxxx');
        done();
    });

    it('Find token and update', function(done) {
        shared.redis.client.set(
            shared.config.redis.namespace.token + 'xxxx-xxxx-xxxx-xxxx',
            '{"restaurantId":"fake-restaurant"}'
        );

        specialRequest(app)
            .put('/tokens')
            .send({ token: 'xxxx-xxxx-xxxx-xxxx' })
            .expect(200)
            .end(function(err, res) {
                var result = res.body;

                result.should.have.property('error', false);
                result.should.have.property('token', 'xxxx-xxxx-xxxx-xxxx');
                result.should.have.property('restaurantId', 'fake-restaurant');

                done();
            });
    });

    it('Get status 400 and { error:true } when token is not found', function(done) {
        specialRequest(app)
            .put('/tokens')
            .send({ token: 'token.which.is.not.exist' })
            .end(function(err, res) {
                var result = res.body;

                result.should.have.property('error', true);
                result.should.have.property('errorMsg', 'Token not found.');
                result.should.have.property('errorCode');
                done();
            });
    });
});
