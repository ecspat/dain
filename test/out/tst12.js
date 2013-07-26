var register, invoke, cbs;

(function() {
	var function_15_1, function_57_1, function_57_2;
	
	register = function (x1) {
	    function_15_1 = x1;
	};
	
	invoke = function (x1, x2) {
		function_57_1 = x1;
		function_57_2 = x2;
	};

	cbs = [];
	
	function_15_1.call(null, function_57_1, function_57_2);
})();