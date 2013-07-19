var register, invoke, cbs;

(function() {
	var function_7_1, function_10_1, function_10_2;
	
	register = function (x1) {
	    function_7_1 = x1;
	};
	
	invoke = function (x1, x2) {
		function_10_1 = x1;
		function_10_2 = x2;
	};

	cbs = [];
	
	function_7_1.call(null, function_10_1, function_10_2);
})();