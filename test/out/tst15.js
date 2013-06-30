var Deferred;
(function() {
	var function_14_0, function_11_0;
	var obj10 = {
		resolve: function(x0) {
			function_11_0 = x0;
		},
		done: function_14
	};
	var function_14 = function(x0) {
		function_14_0 = x0;
		return obj10;
	};
	Deferred = function() {
		return obj10;
	};
	function_14_0.call({ done: function_14 }, function_11_0);
}());