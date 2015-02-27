var when = require('when');

if (require.main === module) {
    var bootstrap = require('./bootstrap'),
        shared = bootstrap.shared();

    when.all([
        bootstrap.redis(shared),
        bootstrap.express(shared),
    ]).
    then(function() {
        bootstrap.http(shared);
    }).
    catch(function(err) {
        shared.getLogger('[app]').error(err);
    });
}
