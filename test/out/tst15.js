var Deferred;
(function() {
	var function_63_1, function_142_1;
	var function_63 = function(x1) {
		function_63_1 = x1;
		return obj_128;
	};
	var obj_128 = {
		resolve: function(x1) {
			function_142_1 = x1;
		},
		done: function_63
	};
	Deferred = function() {
		return obj_128;
	};
	function_63_1.call({ done: function_63 }, function_142_1);
}());