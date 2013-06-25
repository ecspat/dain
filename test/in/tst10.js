var cbs = [];

function register(cb) {
	cbs.push(cb);
}

function invoke(recv) {
	cbs.forEach(function(f) { f.call(recv); });
}