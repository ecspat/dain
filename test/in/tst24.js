var o = (function() {
	var x = 23;
	return {
		get x() {
			return x;
		},
		set x(v) {
			x = Number(v);
		}
	};
})();