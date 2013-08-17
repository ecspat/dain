var Q, flushing;
(function () {
    var $NUMBER$ = Math.random();
    var function_169 = function () {
        return {
            inspect: function () {
                return { state: String($NUMBER$) };
            }
        };
    };
    function_169.fbind = function () {
        return function () {
            return {};
        };
    };
    Q = function_169;
    flushing = !$NUMBER$;
}());