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

describe('Restaurant routing integration tests:', function() {

    before(function(done) {
        when(bootstrap.redis(shared)).then(function() {
            done();
        });
    });

    var stubGetRequest,
        stubUuidV4;

    beforeEach(function(done) {
        stubGetRequest = sinon.stub(request, 'get');
        stubUuidV4 = sinon.stub(uuid, 'v4');
        done();
    });

    afterEach(function(done) {
        stubGetRequest.restore();
        stubUuidV4.restore();
        shared.redis.api.del(shared.config.redis.namespace.token + 'xxxx-xxxx-xxxx-xxxx');
        done();
    });

    it('Get status 400 and { error:true } when restaurant is not found', function(done) {
        // request to Restaurateur:Service
        stubGetRequest.onFirstCall().yields(
            null, // error
            { statusCode: 400 }, // response
            '{ "message": "Restaurant with authCode (wtf) was not found." }'
        );

        specialRequest(app)
            .post('/')
            .send({ authCode: 'wtf' })
            .expect(400)
            .end(function(err, res) {
                var result = res.body;

                result.should.have.property('error');
                result.should.have.property('errorMsg');
                result.error.should.equal(true);
                result.errorMsg.should.equal('Restaurant with authCode (wtf) was not found.');

                var options = stubGetRequest.getCall(0).args[0];
                options.uri.should.equal(
                    shared.config.services.restaurateur + '/auth/wtf'
                );
                done();
            });
    });

    it('Get status 500 and { error:true } at unexpected error on fetching restaurant', function(done) {
        // request to Restaurateur:Service
        stubGetRequest.onFirstCall().yields(
            null,
            { statusCode: 500 },
            '{ "message": "Unexpected error." }'
        );

        specialRequest(app)
            .post('/')
            .send({ authCode: 'wtf' })
            .expect(500)
            .end(function(err, res) {
                var result = res.body;

                result.should.have.property('error');
                result.should.have.property('errorMsg');
                result.error.should.equal(true);
                result.errorMsg.should.equal('Unexpected error.');

                var options = stubGetRequest.getCall(0).args[0];
                options.uri.should.equal(
                    shared.config.services.restaurateur + '/auth/wtf'
                );

                done();
            });
    });

    it('Get Token by AuthCode', function(done) {
        // 1st request to Restaurateur:Service
        stubGetRequest.onFirstCall().yields(
            null, // error
            { statusCode: 200 }, // response
            '{ "id": "fake-restaurant" }' // body
        );
        // 2nd request to Restaurateur:Service
        stubGetRequest.onSecondCall().yields(
            null, // error
            { statusCode: 200 }, // response
            '{ "items": [' +
                '{ "id": "1", "internalId": "1001", "description": "Table 1001 near the door." }, ' +
                '{ "id": "2", "internalId": "1002", "description": "Table 1002 near the WC." }] }' // body
        );
        // 3rd uuid generation
        stubUuidV4.returns('xxxx-xxxx-xxxx-xxxx');

        specialRequest(app)
            .post('/')
            .send({ authCode: 'fake-auth-code' })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
                var result = res.body;

                result.should.have.property('error');
                result.should.have.property('token');
                result.should.have.property('restaurantId');
                result.should.have.property('tables');

                result.error.should.equal(false);
                result.token.should.equal('xxxx-xxxx-xxxx-xxxx');
                result.restaurantId.should.equal('fake-restaurant');
                result.tables.should.have.length(2);

                result.tables[0].should.have.property('id');
                result.tables[0].should.have.property('internalId');
                result.tables[0].should.have.property('description');

                result.tables[0].id.should.equal('1');
                result.tables[0].internalId.should.equal('1001');
                result.tables[0].description.should.equal('Table 1001 near the door.');

                result.tables[1].id.should.equal('2');
                result.tables[1].internalId.should.equal('1002');
                result.tables[1].description.should.equal('Table 1002 near the WC.');

                var restaurateurService = shared.config.services.restaurateur,
                    firstCallUrl = stubGetRequest.getCall(0).args[0].uri,
                    secondCallUrl = stubGetRequest.getCall(1).args[0].uri;

                firstCallUrl.should.be.equal(restaurateurService + '/auth/fake-auth-code');
                secondCallUrl.should.be.equal(restaurateurService + '/restaurants/fake-restaurant/tables');

                shared.redis.api.get(shared.config.redis.namespace.token + 'xxxx-xxxx-xxxx-xxxx')
                    .then(function(value) {
                        try {
                            var json = JSON.parse(value);
                            json.should.have.property('restaurantId', 'fake-restaurant');
                            done();
                        } catch (err) {
                            done(err);
                        }
                    });
            });
    });
});
