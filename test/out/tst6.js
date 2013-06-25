var register, invoke, cbs;

(function() {
	var function_3_15_0;
	
	register = function (x0) {
	    function_3_15_0 = x0;
	};
	
	invoke = function () {
		function_3_15_0();
	};

	// not ideal, this should actually be an array
	cbs = {};
})();