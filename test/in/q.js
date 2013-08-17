(function(definition) {
    Q = definition();
})(function() {
    var nextTick = function() {
        flushing = true;
    };
    var object_create = Object.create;
    function Q() {
        return fulfill();
    }
    function defer() {
        var deferred = object_create(defer.prototype);
        var promise = object_create(Promise.prototype);
        deferred.promise = promise;
        return deferred;
    }
    function Promise(descriptor, fallback, inspect) {
        var promise = object_create(Promise.prototype);
        promise.inspect = inspect;
        var inspected = inspect();
        return promise;
    }
    Promise.prototype.then = function() {};
    function fulfill() {
        return Promise({}, 0, function inspect() {
            return {
                state: "fulfilled"
            };
        });
    }
    Promise.prototype.dispatch = function() {
        var deferred = defer();
        nextTick();
        return deferred.promise;
    };
    Q.fbind = function() {
        var promise = Q();
        return function fbound() {
            return promise.dispatch();
        };
    };
    return Q;
});