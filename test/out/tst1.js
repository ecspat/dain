var A, a;
(function () {
    var $NUMBER$ = Math.random();
    var function_16 = function () {
        this.x = $NUMBER$;
        this['*'] = String($NUMBER$);
    };
    function_16.prototype = {
        m: function () {
        }
    };
    function_16.z = { '*': $NUMBER$ };
    A = function_16;
    a = new function_16();
}());
