var Deferred;
(function() {
	var function_14_0, function_14_1, function_11_1;
	var function_14 = function(x1) {
			function_14_0 = this;
			function_14_1 = x1;
			return function_14_0;
		};
	Deferred = function() {
		return {
			resolve: function(x1) {
				function_11_1 = x1;
			},
			done: function_14
		};
	};
	function_14_1.call({
		done: function_14
	}, function_11_1);
}());