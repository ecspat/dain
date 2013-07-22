/*global window*/
(function(window, undefined) {
    var jQuery = function() {
        return new jQuery.init();
    };
    jQuery.init = function() {
        return this;
    };
    window.rootjQuery = jQuery();
    jQuery();
    window.jQuery = jQuery;
})(window);