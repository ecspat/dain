var cbs = [];

function register(cb) {
	cbs.push(cb);
}

function invoke() {
	var args = arguments;
	cbs.forEach(function(f) { f.apply(null, args); });
}