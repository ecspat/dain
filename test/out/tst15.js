var Deferred;
(function() {
	var function_14_1, function_11_1;
	var obj10 = {
		resolve: function(x1) {
			function_11_1 = x1;
		},
		done: function_14
	};
	var function_14 = function(x1) {
		function_14_1 = x1;
		return obj10;
	};
	Deferred = function() {
		return obj10;
	};
	function_14_1.call({ done: function_14 }, function_11_1);
}());