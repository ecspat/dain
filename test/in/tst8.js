var cbs = [];

function register(cb) {
	cbs.push(cb);
}

function invoke() {
	cbs.forEach(function(f) { f(); });
}