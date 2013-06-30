var promise = Deferred();
promise.done(function(o) { o.x; });
promise.resolve({x:42});