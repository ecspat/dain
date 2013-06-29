var A, a;
(function () {
    var $NUMBER$ = Math.random();
    var function_7 = function () {
        this.x = $NUMBER$;
        this['*'] = String($NUMBER$);
    };
    function_7.prototype = {
        m: function () {
        }
    };
    function_7.z = { '*': $NUMBER$ };
    A = function_7;
    a = new function_7();
}());
