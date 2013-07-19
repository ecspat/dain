var register, invoke, cbs;

(function() {
	var function_7_1, function_10_1;
	
	register = function (x1) {
	    function_7_1 = x1;
	};
	
	invoke = function (x1) {
	    function_10_1 = x1;
	};

	cbs = [];
	
	function_7_1.call(function_10_1, Math.random());
})();