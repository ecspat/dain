var Deferred;
(function() {
	var function_12_1, function_16_1;
	var obj19 = {
		resolve: function(x1) {
			function_16_1 = x1;
		},
		done: function_12
	};
	var function_12 = function(x1) {
		function_12_1 = x1;
		return obj19;
	};
	Deferred = function() {
		return obj19;
	};
	function_12_1.call({ done: function_12 }, function_16_1);
}());