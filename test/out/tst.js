var A, a;
(function () {
    var $$NUMBER$$ = Math.random();
    var function_1_0 = function () {
        this.x = $$NUMBER$$;
        this['*'] = String($$NUMBER$$);
    };
    function_1_0.prototype = {
        m: function () {
        }
    };
    function_1_0.z = { '*': $$NUMBER$$ };
    A = function_1_0;
    a = new function_1_0();
}());
