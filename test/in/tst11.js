var cbs = [];

function register(cb) {
	cbs.push(cb);
}

function invoke(recv, args) {
	cbs.forEach(function(f) { f.apply(recv, args); });
}